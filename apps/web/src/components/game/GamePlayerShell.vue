<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { LocationQueryRaw } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';

import type { GameCatalogItem } from '@casual-game-world/shared';
import type { BridgeEvent, GameOverPayload } from '@casual-game-world/game-sdk';

import { trackEvent } from '@/api/events.api';
import AdSlot from '@/components/ads/AdSlot.vue';
import GameIframe from '@/components/game/GameIframe.vue';
import GameOverModal from '@/components/game/GameOverModal.vue';
import { useAuthStore } from '@/stores/auth.store';
import { usePlaySessionStore } from '@/stores/play-session.store';
import { useRankingStore } from '@/stores/ranking.store';
import { formatScore } from '@/utils/format';

const props = defineProps<{
  game: GameCatalogItem;
  relatedGames: GameCatalogItem[];
}>();

const HOSTED_ROOM_STORAGE_KEY_PREFIX = 'cgw-hosted-room:';

function normalizeRoomQuery(value: unknown) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function hostedRoomStorageKey(slug: string) {
  return `${HOSTED_ROOM_STORAGE_KEY_PREFIX}${slug}`;
}

function readHostedRoomId(slug: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  return normalizeRoomQuery(window.sessionStorage.getItem(hostedRoomStorageKey(slug)));
}

function persistHostedRoomId(slug: string, roomId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  const key = hostedRoomStorageKey(slug);
  if (roomId) {
    window.sessionStorage.setItem(key, roomId);
    return;
  }

  window.sessionStorage.removeItem(key);
}

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const playSessionStore = usePlaySessionStore();
const rankingStore = useRankingStore();
const iframeRef = ref<InstanceType<typeof GameIframe> | null>(null);
const currentMode = ref(props.game.modes[0] ?? 'normal');
const gameReady = ref(false);
const rewardLoading = ref(false);
const rewardOffered = ref(false);
const modalVisible = ref(false);
const latestRank = ref<number | null>(null);
const pendingPayload = ref<GameOverPayload | null>(null);
const focusMode = ref(true);
const fullscreenRootRef = ref<HTMLElement | null>(null);
const browserFullscreenActive = ref(Boolean(document.fullscreenElement));
const hostedRoomId = ref<string | null>(readHostedRoomId(props.game.slug));
const inviteJoinRequested = ref(false);
const lastJoinCommandKey = ref('');

const playOrigin = computed(() => new URL(props.game.entryUrl).origin);
const browserFullscreenSupported = computed(() => typeof document !== 'undefined' && 'fullscreenEnabled' in document);
const inviteRoomId = computed(() => normalizeRoomQuery(route.query.room));
const inviteRequestKey = computed(() => {
  if (!inviteRoomId.value) {
    return '';
  }

  return `${props.game.slug}:${playSessionStore.iframeKey}:${inviteRoomId.value}`;
});
const invitePromptVisible = computed(
  () =>
    Boolean(inviteRoomId.value) &&
    inviteRoomId.value !== hostedRoomId.value &&
    lastJoinCommandKey.value !== inviteRequestKey.value,
);
const inviteJoinButtonLabel = computed(() => {
  if (!inviteJoinRequested.value) {
    return '참가하기';
  }

  return gameReady.value ? '참가 요청 중...' : '입장 준비 중...';
});
const layoutClass = computed(() => ({
  'is-portrait': props.game.orientation === 'portrait',
  'is-square': props.game.aspectRatio === '1:1',
  'is-focus-mode': focusMode.value,
  'is-browser-fullscreen': browserFullscreenActive.value,
}));

async function bootstrapSession() {
  currentMode.value = props.game.modes[0] ?? 'normal';
  latestRank.value = null;
  pendingPayload.value = null;
  rewardOffered.value = false;
  modalVisible.value = false;
  gameReady.value = false;
  focusMode.value = true;
  await playSessionStore.start(props.game.slug, currentMode.value);
  await nextTick();
  void requestBrowserFullscreen();
}

async function syncRoomQuery(roomId: string | null) {
  const currentRoomId = normalizeRoomQuery(route.query.room);
  if (currentRoomId === roomId) {
    return;
  }

  const nextQuery: LocationQueryRaw = { ...route.query };
  if (roomId) {
    nextQuery.room = roomId;
  } else {
    delete nextQuery.room;
  }

  await router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash,
  });
}

function syncJoinRequest() {
  const roomId = inviteRoomId.value;

  if (!roomId) {
    inviteJoinRequested.value = false;
    lastJoinCommandKey.value = '';
    return;
  }

  if (roomId === hostedRoomId.value || !inviteJoinRequested.value) {
    return;
  }

  if (!gameReady.value || !iframeRef.value) {
    return;
  }

  const requestKey = inviteRequestKey.value;
  if (lastJoinCommandKey.value === requestKey) {
    return;
  }

  iframeRef.value.postHostMessage(
    {
      type: 'MULTIPLAYER_JOIN_ROOM',
      payload: { roomId },
    },
    playOrigin.value,
  );
  lastJoinCommandKey.value = requestKey;
  inviteJoinRequested.value = false;
}

function requestInviteJoin() {
  if (!inviteRoomId.value) {
    return;
  }

  inviteJoinRequested.value = true;
  syncJoinRequest();
}

async function loadRankForLastScore() {
  const ranking = await rankingStore.loadGameRanking(props.game.slug, {
    period: 'daily',
    mode: currentMode.value,
  });
  latestRank.value =
    ranking.items.find((item: { scoreId: string; rank: number }) => item.scoreId === playSessionStore.lastScore?.id)?.rank ??
    ranking.myBest?.rank ??
    null;
}

async function finalizePendingScore() {
  if (!pendingPayload.value) {
    return;
  }

  const payload = pendingPayload.value;
  pendingPayload.value = null;
  rewardOffered.value = false;
  await playSessionStore.finalize(props.game.slug, payload);
  await loadRankForLastScore();
  modalVisible.value = true;
  await trackEvent('game-over', {
    gameSlug: props.game.slug,
    score: payload.score,
    playTimeMs: payload.playTimeMs,
    mode: payload.mode,
  });
}

async function handleMessage(event: MessageEvent<BridgeEvent>) {
  if (event.origin !== playOrigin.value || typeof event.data !== 'object' || !event.data) {
    return;
  }

  switch (event.data.type) {
    case 'GAME_READY':
      gameReady.value = true;
      syncJoinRequest();
      break;
    case 'GAME_START':
      await trackEvent('game-start', {
        gameSlug: props.game.slug,
        sessionId: playSessionStore.session?.sessionId,
        mode: currentMode.value,
      });
      break;
    case 'GAME_OVER':
      pendingPayload.value = event.data.payload;
      currentMode.value = event.data.payload.mode;
      modalVisible.value = true;

      if (!event.data.payload.metadata?.reviveAvailable) {
        await finalizePendingScore();
      }
      break;
    case 'REQUEST_REWARDED_AD':
      rewardOffered.value = true;
      modalVisible.value = true;
      break;
    case 'MULTIPLAYER_ROOM_CREATED':
      hostedRoomId.value = event.data.payload.roomId;
      persistHostedRoomId(props.game.slug, event.data.payload.roomId);
      await syncRoomQuery(event.data.payload.roomId);
      break;
    case 'MULTIPLAYER_ROOM_CLEARED':
      hostedRoomId.value = null;
      persistHostedRoomId(props.game.slug, null);
      inviteJoinRequested.value = false;
      await syncRoomQuery(null);
      break;
    default:
      break;
  }
}

async function replay() {
  await playSessionStore.replay(props.game.slug, currentMode.value);
  modalVisible.value = false;
  rewardOffered.value = false;
  pendingPayload.value = null;
}

async function requestReward() {
  rewardLoading.value = true;
  try {
    await new Promise((resolve) => window.setTimeout(resolve, 1800));
    iframeRef.value?.postHostMessage(
      {
        type: 'REWARD_GRANTED',
        payload: { reason: 'REVIVE' },
      },
      playOrigin.value,
    );
    rewardOffered.value = false;
    modalVisible.value = false;
    pendingPayload.value = null;
  } finally {
    rewardLoading.value = false;
  }
}

async function declineRewardAndFinalize() {
  iframeRef.value?.postHostMessage(
    {
      type: 'REWARD_CANCELED',
      payload: { reason: 'REVIVE' },
    },
    playOrigin.value,
  );
  await finalizePendingScore();
}

function closeModal() {
  if (rewardOffered.value) {
    void declineRewardAndFinalize();
    return;
  }
  modalVisible.value = false;
}

function goToLogin() {
  router.push(`/login?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`);
}

function goToRanking() {
  router.push(`/games/${props.game.slug}/ranking`);
}

function handleFullscreenChange() {
  browserFullscreenActive.value = Boolean(document.fullscreenElement);
}

async function requestBrowserFullscreen() {
  if (!browserFullscreenSupported.value || !fullscreenRootRef.value || document.fullscreenElement) {
    return;
  }

  try {
    await fullscreenRootRef.value.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    // Browsers can reject autoplay-like fullscreen requests without a fresh user gesture.
  }
}

async function exitBrowserFullscreen() {
  if (!document.fullscreenElement) {
    return;
  }

  try {
    await document.exitFullscreen();
  } catch {
    // Ignore browser-specific exit failures.
  }
}

function toggleFocusMode() {
  focusMode.value = !focusMode.value;
}

async function toggleBrowserFullscreen() {
  if (browserFullscreenActive.value) {
    await exitBrowserFullscreen();
    return;
  }

  await requestBrowserFullscreen();
}

function syncImmersiveBodyState() {
  document.body.classList.toggle('immersive-play', focusMode.value);
}

onMounted(async () => {
  syncImmersiveBodyState();
  await bootstrapSession();
  await trackEvent('page-view', {
    page: 'game-play',
    gameSlug: props.game.slug,
  });
  window.addEventListener('message', handleMessage as unknown as EventListener);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

watch(
  () => props.game.slug,
  () => {
    hostedRoomId.value = readHostedRoomId(props.game.slug);
    inviteJoinRequested.value = false;
    lastJoinCommandKey.value = '';
    void bootstrapSession();
  },
);

watch(focusMode, () => {
  syncImmersiveBodyState();
});

watch(
  () => route.query.room,
  () => {
    const roomId = inviteRoomId.value;
    if (!roomId) {
      inviteJoinRequested.value = false;
    } else if (roomId !== hostedRoomId.value && lastJoinCommandKey.value !== inviteRequestKey.value) {
      inviteJoinRequested.value = false;
    }
    syncJoinRequest();
  },
  { immediate: true },
);

watch([gameReady, () => playSessionStore.iframeKey], () => {
  syncJoinRequest();
});

onBeforeUnmount(() => {
  document.body.classList.remove('immersive-play');
  window.removeEventListener('message', handleMessage as unknown as EventListener);
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  if (document.fullscreenElement === fullscreenRootRef.value) {
    void exitBrowserFullscreen();
  }
});
</script>

<template>
  <section class="play-layout" :class="layoutClass">
    <aside class="play-side">
      <article class="info-panel sticky-panel">
        <p class="eyebrow">Play Brief</p>
        <h1>{{ game.title }}</h1>
        <p>{{ game.shortDescription }}</p>
        <ul class="plain-list">
          <li>조작: {{ game.inputs.join(', ') }}</li>
          <li>모드: {{ game.modes.join(', ') }}</li>
          <li>내 최고점: {{ formatScore(playSessionStore.myBest?.score ?? 0) }}</li>
        </ul>
      </article>
    </aside>

    <div class="play-center">
      <div ref="fullscreenRootRef" class="play-stage" :class="{ 'is-focus-stage': focusMode }">
        <div class="play-stage-header">
          <div class="play-stage-copy">
            <span class="eyebrow">iframe runtime</span>
            <strong>{{ gameReady ? '게임 준비 완료' : '게임 로딩 중...' }}</strong>
          </div>
          <div class="play-stage-actions">
            <button class="pill-button quiet" @click="toggleFocusMode">
              {{ focusMode ? '정보 보기' : '집중 보기' }}
            </button>
            <button
              v-if="browserFullscreenSupported"
              class="pill-button quiet"
              @click="toggleBrowserFullscreen"
            >
              {{ browserFullscreenActive ? '전체화면 종료' : '브라우저 전체화면' }}
            </button>
            <RouterLink class="text-link" :to="`/games/${game.slug}/ranking`">랭킹</RouterLink>
            <RouterLink class="text-link" :to="`/games/${game.slug}`">상세로 돌아가기</RouterLink>
          </div>
        </div>
        <article v-if="invitePromptVisible" class="info-panel">
          <p class="eyebrow">Invite</p>
          <h2>온라인 매치 초대가 도착했습니다.</h2>
          <p>버튼을 누르면 공유 받은 방에 참가하고, 연결이 성립되면 바로 매치가 시작됩니다.</p>
          <button class="pill-button" :disabled="inviteJoinRequested" @click="requestInviteJoin">
            {{ inviteJoinButtonLabel }}
          </button>
        </article>
        <GameIframe
          ref="iframeRef"
          :frame-key="playSessionStore.iframeKey"
          :src="game.entryUrl"
          :title="game.title"
          :aspect-ratio="game.aspectRatio"
          :fit-viewport="focusMode"
        />
      </div>

      <div v-if="!focusMode" class="related-strip">
        <RouterLink
          v-for="related in relatedGames"
          :key="related.id"
          class="feature-link"
          :to="`/games/${related.slug}`"
        >
          <span>{{ related.title }}</span>
          <small>{{ related.shortDescription }}</small>
        </RouterLink>
      </div>
    </div>

    <aside class="play-side">
      <AdSlot page="game-play" position="right-rail" :game-slug="game.slug" />
      <article class="info-panel">
        <p class="eyebrow">Ranking snapshot</p>
        <h2>오늘의 내 위치</h2>
        <p>{{ latestRank ? `${latestRank}위` : '플레이 후 계산됩니다.' }}</p>
        <RouterLink class="text-link" :to="`/games/${game.slug}/ranking`">전체 랭킹 보기</RouterLink>
      </article>
    </aside>

    <GameOverModal
      :visible="modalVisible"
      :score="pendingPayload?.score ?? playSessionStore.lastScore?.score ?? 0"
      :my-best="playSessionStore.myBest?.score"
      :rank="latestRank"
      :signed-in="authStore.isAuthenticated"
      :reward-available="rewardOffered"
      :reward-loading="rewardLoading"
      :finalized="!rewardOffered"
      @close="closeModal"
      @ranking="goToRanking"
      @replay="replay"
      @login="goToLogin"
      @reward="requestReward"
    />
  </section>
</template>

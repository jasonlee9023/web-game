<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { GameMode, RankingPeriod } from '@casual-game-world/shared';

import AdSlot from '@/components/ads/AdSlot.vue';
import RankingFilter from '@/components/ranking/RankingFilter.vue';
import LeaderboardTable from '@/components/ranking/LeaderboardTable.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useGameStore } from '@/stores/game.store';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';

const route = useRoute();
const authStore = useAuthStore();
const gameStore = useGameStore();
const rankingStore = useRankingStore();
const period = ref<RankingPeriod>('daily');
const mode = ref<GameMode>('normal');

async function load() {
  const game = await gameStore.loadGame(route.params.slug.toString());
  mode.value = game.modes[0] ?? 'normal';
  await rankingStore.loadGameRanking(game.slug, { period: period.value, mode: mode.value });
  applySeo({
    title: `${game.title} 랭킹`,
    description: `${game.title}의 기간별 랭킹과 내 기록을 확인하는 페이지`,
  });
}

onMounted(load);
watch([period, mode], () => {
  if (gameStore.currentGame) {
    void rankingStore.loadGameRanking(gameStore.currentGame.slug, { period: period.value, mode: mode.value });
  }
});
</script>

<template>
  <section v-if="gameStore.currentGame" class="content-shell page-stack">
    <header class="page-hero compact">
      <p class="eyebrow">Leaderboard</p>
      <h1>{{ gameStore.currentGame.title }} 랭킹</h1>
      <div class="hero-actions">
        <RouterLink class="pill-button" :to="`/games/${gameStore.currentGame.slug}/play`">플레이하기</RouterLink>
      </div>
    </header>

    <RankingFilter v-model:period="period" v-model:mode="mode" :modes="gameStore.currentGame.modes" />

    <article class="info-panel">
      <p class="eyebrow">My record</p>
      <h2>내 기록 카드</h2>
      <p v-if="rankingStore.ranking?.myBest">
        {{ rankingStore.ranking.myBest.displayName }} · {{ rankingStore.ranking.myBest.rank }}위 ·
        {{ rankingStore.ranking.myBest.score.toLocaleString() }}점
      </p>
      <p v-else-if="authStore.isAuthenticated">아직 등록된 기록이 없습니다. 먼저 한 판 플레이해 보세요.</p>
      <p v-else>로그인하면 점수를 저장하고 랭킹에 안정적으로 등록할 수 있습니다.</p>
    </article>

    <LeaderboardTable :items="rankingStore.ranking?.items ?? []" />

    <AdSlot page="ranking" position="mid-content" :game-slug="gameStore.currentGame.slug" />
  </section>
</template>


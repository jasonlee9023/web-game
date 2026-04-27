<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import AdSlot from '@/components/ads/AdSlot.vue';
import GameGrid from '@/components/game/GameGrid.vue';
import LeaderboardTable from '@/components/ranking/LeaderboardTable.vue';
import { useGameStore } from '@/stores/game.store';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';
import { formatCompact, formatScore } from '@/utils/format';

const route = useRoute();
const gameStore = useGameStore();
const rankingStore = useRankingStore();
const detailRightRailAdRequested = ref(false);

function requestDetailRightRailAd() {
  if (detailRightRailAdRequested.value) {
    return;
  }

  detailRightRailAdRequested.value = true;
  try {
    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.push({});
  } catch (error) {
    detailRightRailAdRequested.value = false;
    console.warn('Detail right rail AdSense request failed', error);
  }
}

async function load() {
  const slug = route.params.slug.toString();
  const game = await gameStore.loadGame(slug);
  await Promise.all([
    gameStore.loadRelated(slug),
    rankingStore.loadGameRanking(slug, { period: 'daily', mode: game.modes[0] ?? 'normal' }),
  ]);
  applySeo({
    title: game.title,
    description: game.shortDescription,
  });
  await nextTick();
  requestDetailRightRailAd();
}

onMounted(load);
watch(() => route.params.slug, () => {
  void load();
});
</script>

<template>
  <section v-if="gameStore.currentGame" class="content-shell page-stack">
    <div class="detail-layout">
      <article class="detail-main">
        <img class="detail-banner" :src="gameStore.currentGame.bannerUrl" :alt="gameStore.currentGame.title" />
        <p class="eyebrow">Game Detail</p>
        <h1>{{ gameStore.currentGame.title }}</h1>
        <p class="lead">{{ gameStore.currentGame.shortDescription }}</p>
        <div class="chip-row">
          <span v-for="tag in gameStore.currentGame.tags" :key="tag" class="soft-chip">{{ tag }}</span>
        </div>
        <div class="metric-strip">
          <article>
            <strong>{{ formatCompact(gameStore.currentGame.playCount) }}</strong>
            <span>플레이 수</span>
          </article>
          <article>
            <strong>{{ formatScore(gameStore.currentGame.bestScore) }}</strong>
            <span>전체 최고점</span>
          </article>
          <article>
            <strong>{{ gameStore.currentGame.averageSessionSeconds }}초</strong>
            <span>평균 세션</span>
          </article>
        </div>
        <div class="hero-actions">
          <RouterLink class="pill-button" :to="`/games/${gameStore.currentGame.slug}/play`">지금 플레이</RouterLink>
          <RouterLink class="pill-button quiet" :to="`/games/${gameStore.currentGame.slug}/ranking`">랭킹 보기</RouterLink>
        </div>
      </article>

      <aside class="detail-side">
        <aside class="ad-slot detail-right-rail-ad" data-position="right-rail" data-provider="adsense">
          <ins
            class="adsbygoogle ad-slot-unit"
            style="display: block; text-align: center"
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client="ca-pub-2016140648106882"
            data-ad-slot="1264910007"
          ></ins>
        </aside>
        <article class="info-panel">
          <p class="eyebrow">Today Top 5</p>
          <h2>오늘의 랭킹</h2>
          <LeaderboardTable :items="rankingStore.ranking?.items.slice(0, 5) ?? []" />
        </article>
      </aside>
    </div>

    <section class="info-panel">
      <p class="eyebrow">How to play</p>
      <h2>게임 방법</h2>
      <p>{{ gameStore.currentGame.description }}</p>
      <ul class="plain-list">
        <li>조작 입력: {{ gameStore.currentGame.inputs.join(', ') }}</li>
        <li>점수 모드: {{ gameStore.currentGame.modes.join(', ') }}</li>
        <li>랭킹 기준: {{ gameStore.currentGame.scoreOrder === 'higher_better' ? '높은 점수 우선' : '낮은 점수 우선' }}</li>
      </ul>
    </section>

    <AdSlot page="game-detail" position="mid-content" :game-slug="gameStore.currentGame.slug" />

    <section class="section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Related Games</p>
          <h2>같이 보면 좋은 게임</h2>
        </div>
      </div>
      <GameGrid :games="gameStore.relatedGames" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

import AdSlot from '@/components/ads/AdSlot.vue';
import GameGrid from '@/components/game/GameGrid.vue';
import LeaderboardTable from '@/components/ranking/LeaderboardTable.vue';
import { useGameStore } from '@/stores/game.store';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';

const gameStore = useGameStore();
const rankingStore = useRankingStore();

const dailyTop = computed(() =>
  rankingStore.globalRanking?.buckets.flatMap((bucket) => bucket.items.slice(0, 2)).slice(0, 10) ?? [],
);

onMounted(async () => {
  applySeo({
    title: '메인',
    description: '추천 게임, 오늘의 랭킹, 광고 안전 영역을 갖춘 캐주얼 게임 포털 메인 페이지',
  });
  await Promise.all([gameStore.loadGames(), rankingStore.loadGlobalRanking('daily')]);
});
</script>

<template>
  <section class="page-stack">
    <div class="content-shell hero-grid">
      <section class="hero-card">
        <p class="eyebrow">Ad-safe arcade platform</p>
        <h1>광고는 조작 영역 밖으로, 플레이는 한 탭 안으로</h1>
        <p class="lead">
          메인·상세·랭킹은 검색과 체류 시간을 담당하고, 플레이 페이지는 iframe 게임 런타임과 점수 제출 SDK로
          분리했습니다.
        </p>
        <div class="hero-actions">
          <RouterLink class="pill-button" to="/games">지금 플레이</RouterLink>
          <RouterLink class="pill-button quiet" to="/rankings">오늘의 랭킹</RouterLink>
        </div>
        <div class="metric-strip">
          <article>
            <strong>{{ gameStore.games.length }}</strong>
            <span>오픈 게임</span>
          </article>
          <article>
            <strong>{{ dailyTop.length }}</strong>
            <span>오늘의 하이라이트</span>
          </article>
          <article>
            <strong>iframe</strong>
            <span>독립 런타임</span>
          </article>
        </div>
      </section>

      <section class="hero-side">
        <AdSlot page="home" position="top-banner" />
        <div class="feature-panel">
          <h2>오늘의 추천</h2>
          <div class="feature-list">
            <RouterLink
              v-for="game in gameStore.featuredGames.slice(0, 3)"
              :key="game.id"
              class="feature-link"
              :to="`/games/${game.slug}`"
            >
              <span>{{ game.title }}</span>
              <small>{{ game.shortDescription }}</small>
            </RouterLink>
          </div>
        </div>
      </section>
    </div>

    <section class="content-shell section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured grid</p>
          <h2>오늘 바로 점수 경쟁을 시작할 게임</h2>
        </div>
        <div class="chip-row">
          <span v-for="category in gameStore.categories" :key="category" class="soft-chip">{{ category }}</span>
        </div>
      </div>
      <GameGrid :games="gameStore.games.slice(0, 4)" />
      <AdSlot page="home" position="in-feed" />
      <GameGrid :games="gameStore.games.slice(4)" />
    </section>

    <section class="content-shell two-column-panel">
      <article class="info-panel">
        <p class="eyebrow">Daily top 10</p>
        <h2>오늘 가장 높은 점수</h2>
        <LeaderboardTable :items="dailyTop" />
      </article>
      <article class="info-panel">
        <p class="eyebrow">Recent activity</p>
        <h2>최근 플레이한 게임</h2>
        <div class="feature-list">
          <RouterLink
            v-for="game in gameStore.recentGames.length ? gameStore.recentGames : gameStore.games.slice(0, 3)"
            :key="game.id"
            class="feature-link"
            :to="`/games/${game.slug}`"
          >
            <span>{{ game.title }}</span>
            <small>{{ game.tags.join(' · ') }}</small>
          </RouterLink>
        </div>
      </article>
    </section>
  </section>
</template>


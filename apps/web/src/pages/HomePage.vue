<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';

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
const heroGame = computed(() => gameStore.games.find((game) => game.slug === 'dungeon-quest') ?? gameStore.featuredGames[0] ?? gameStore.games[0]);
const heroImageUrl = computed(() => heroGame.value?.thumbnailUrl ?? heroGame.value?.bannerUrl);
const recommendationGames = computed(() => {
  const featured = gameStore.featuredGames.filter((game) => game.slug !== heroGame.value?.slug).slice(0, 3);
  return featured.length ? featured : gameStore.games.filter((game) => game.slug !== heroGame.value?.slug).slice(0, 3);
});
const firstGridGames = computed(() => gameStore.games.slice(0, 4));
const remainingGames = computed(() => gameStore.games.slice(4));
const homeAdsRequested = ref(false);

function requestHomeAds() {
  if (homeAdsRequested.value) {
    return;
  }

  homeAdsRequested.value = true;
  try {
    window.adsbygoogle = window.adsbygoogle ?? [];
    window.adsbygoogle.push({});
    window.adsbygoogle.push({});
  } catch (error) {
    homeAdsRequested.value = false;
    console.warn('Home AdSense request failed', error);
  }
}

onMounted(async () => {
  applySeo({
    title: '메인',
    description: '추천 게임, 오늘의 랭킹, 광고 안전 영역을 갖춘 캐주얼 게임 포털 메인 페이지',
  });
  await nextTick();
  requestHomeAds();
  await Promise.all([gameStore.loadGames(), rankingStore.loadGlobalRanking('daily')]);
});
</script>

<template>
  <section class="home-page page-stack">
    <section class="home-spotlight">
      <div class="content-shell home-spotlight-inner">
        <div class="spotlight-copy">
          <p class="eyebrow">Today pick</p>
          <h1>한 판 고르고 바로 랭킹 경쟁</h1>
          <p class="lead">짧게 플레이하고, 오늘 점수판에서 다시 도전할 게임을 빠르게 찾으세요.</p>
          <div class="hero-actions">
            <RouterLink class="pill-button" to="/games">게임 찾기</RouterLink>
            <RouterLink class="pill-button quiet" to="/rankings">랭킹 보기</RouterLink>
          </div>
          <div class="spotlight-stats">
            <article>
              <strong>{{ gameStore.games.length }}</strong>
              <span>게임</span>
            </article>
            <article>
              <strong>{{ dailyTop.length }}</strong>
              <span>오늘 기록</span>
            </article>
            <article>
              <strong>{{ heroGame ? `${heroGame.averageSessionSeconds}초` : '-' }}</strong>
              <span>추천 세션</span>
            </article>
          </div>
        </div>

        <RouterLink v-if="heroGame" class="spotlight-preview" :to="`/games/${heroGame.slug}/play`">
          <img :src="heroImageUrl" :alt="heroGame.title" />
          <div class="spotlight-preview-body">
            <span class="game-card-category">{{ heroGame.categories[0] }}</span>
            <h2>{{ heroGame.title }}</h2>
            <p>{{ heroGame.shortDescription }}</p>
            <span class="spotlight-play">바로 플레이</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <div class="content-shell home-secondary-grid">
      <aside class="ad-slot home-top-banner-ad" data-position="top-banner" data-provider="adsense">
        <!-- home-top-banner -->
        <ins
          class="adsbygoogle ad-slot-unit"
          style="display: block"
          data-ad-client="ca-pub-2016140648106882"
          data-ad-slot="1727199573"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </aside>
      <section class="feature-panel compact-list">
        <div class="section-heading tight">
          <div>
            <p class="eyebrow">Queue</p>
            <h2>추천 큐</h2>
          </div>
          <RouterLink class="text-link" to="/games">전체</RouterLink>
        </div>
        <div class="feature-list">
          <RouterLink
            v-for="game in recommendationGames"
            :key="game.id"
            class="feature-link"
            :to="`/games/${game.slug}`"
          >
            <span>{{ game.title }}</span>
            <small>{{ game.shortDescription }}</small>
          </RouterLink>
        </div>
      </section>
    </div>

    <section class="content-shell section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Catalog</p>
          <h2>오늘 플레이할 게임</h2>
        </div>
        <div class="chip-row">
          <span v-for="category in gameStore.categories" :key="category" class="soft-chip">{{ category }}</span>
        </div>
      </div>
      <GameGrid :games="firstGridGames" />
      <aside class="ad-slot home-in-feed-ad" data-position="in-feed" data-provider="adsense">
        <ins
          class="adsbygoogle ad-slot-unit"
          style="display: block"
          data-ad-format="fluid"
          data-ad-layout-key="-fb+5w+4e-db+86"
          data-ad-client="ca-pub-2016140648106882"
          data-ad-slot="3255903663"
        ></ins>
      </aside>
      <GameGrid :games="remainingGames" />
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

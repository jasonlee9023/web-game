<script setup lang="ts">
import { computed, onMounted } from 'vue';

import AdSlot from '@/components/ads/AdSlot.vue';
import GameGrid from '@/components/game/GameGrid.vue';
import { currentLanguage } from '@/i18n/language';
import { getLocalizedGameCopy } from '@/i18n/game-copy';
import LeaderboardTable from '@/components/ranking/LeaderboardTable.vue';
import { useGameStore } from '@/stores/game.store';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';

const gameStore = useGameStore();
const rankingStore = useRankingStore();

const dailyTop = computed(() =>
  rankingStore.globalRanking?.buckets.flatMap((bucket) => bucket.items.slice(0, 2)).slice(0, 10) ?? [],
);
const heroGame = computed(() => gameStore.games.find((game) => game.slug === 'hero-journey') ?? gameStore.featuredGames[0] ?? gameStore.games[0]);
const heroImageUrl = computed(() => heroGame.value?.thumbnailUrl ?? heroGame.value?.bannerUrl);
const localizedHeroGame = computed(() => (heroGame.value ? getLocalizedGameCopy(heroGame.value) : null));
const recommendationGames = computed(() => {
  const featured = gameStore.featuredGames.filter((game) => game.slug !== heroGame.value?.slug).slice(0, 3);
  return featured.length ? featured : gameStore.games.filter((game) => game.slug !== heroGame.value?.slug).slice(0, 3);
});
const firstGridGames = computed(() => gameStore.games.slice(0, 4));
const remainingGames = computed(() => gameStore.games.slice(4));
const copy = computed(() => ({
  headline: currentLanguage.value === 'en' ? 'Pick a Game and Chase the Rankings' : '한 판 고르고 바로 랭킹 경쟁',
  lead:
    currentLanguage.value === 'en'
      ? 'Play a quick round and find your next score chase from today’s leaderboard.'
      : '짧게 플레이하고, 오늘 점수판에서 다시 도전할 게임을 빠르게 찾으세요.',
  findGames: currentLanguage.value === 'en' ? 'Find Games' : '게임 찾기',
  viewRankings: currentLanguage.value === 'en' ? 'View Rankings' : '랭킹 보기',
  games: currentLanguage.value === 'en' ? 'Games' : '게임',
  todayRecords: currentLanguage.value === 'en' ? 'Today Records' : '오늘 기록',
  recommendedSession: currentLanguage.value === 'en' ? 'Recommended Session' : '추천 세션',
  seconds: currentLanguage.value === 'en' ? 'sec' : '초',
  playNow: currentLanguage.value === 'en' ? 'Play Now' : '바로 플레이',
  queue: currentLanguage.value === 'en' ? 'Recommended Queue' : '추천 큐',
  all: currentLanguage.value === 'en' ? 'All' : '전체',
  todayGames: currentLanguage.value === 'en' ? 'Games to Play Today' : '오늘 플레이할 게임',
  dailyTop: currentLanguage.value === 'en' ? 'Today’s High Scores' : '오늘 가장 높은 점수',
  recent: currentLanguage.value === 'en' ? 'Recently Played' : '최근 플레이한 게임',
}));

onMounted(async () => {
  applySeo({
    title: '메인',
    description: '추천 게임, 오늘의 랭킹, 광고 안전 영역을 갖춘 캐주얼 게임 포털 메인 페이지',
  });
  await Promise.all([gameStore.loadGames(), rankingStore.loadGlobalRanking('daily')]);
});
</script>

<template>
  <section class="home-page page-stack">
    <section class="home-spotlight">
      <div class="content-shell home-spotlight-inner">
        <div class="spotlight-copy">
          <p class="eyebrow">Today pick</p>
          <h1>{{ copy.headline }}</h1>
          <p class="lead">{{ copy.lead }}</p>
          <div class="hero-actions">
            <RouterLink class="pill-button" to="/games">{{ copy.findGames }}</RouterLink>
            <RouterLink class="pill-button quiet" to="/rankings">{{ copy.viewRankings }}</RouterLink>
          </div>
          <div class="spotlight-stats">
            <article>
              <strong>{{ gameStore.games.length }}</strong>
              <span>{{ copy.games }}</span>
            </article>
            <article>
              <strong>{{ dailyTop.length }}</strong>
              <span>{{ copy.todayRecords }}</span>
            </article>
            <article>
              <strong>{{ heroGame ? `${heroGame.averageSessionSeconds}${copy.seconds}` : '-' }}</strong>
              <span>{{ copy.recommendedSession }}</span>
            </article>
          </div>
        </div>

        <RouterLink v-if="heroGame" class="spotlight-preview" :to="`/games/${heroGame.slug}/play`">
          <img :src="heroImageUrl" :alt="localizedHeroGame?.title" />
          <div class="spotlight-preview-body">
            <span class="game-card-category">{{ heroGame.categories[0] }}</span>
            <h2>{{ localizedHeroGame?.title }}</h2>
            <p>{{ localizedHeroGame?.shortDescription }}</p>
            <span class="spotlight-play">{{ copy.playNow }}</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <div class="content-shell home-secondary-grid">
      <AdSlot page="home" position="top-banner" />
      <section class="feature-panel compact-list">
        <div class="section-heading tight">
          <div>
            <p class="eyebrow">Queue</p>
            <h2>{{ copy.queue }}</h2>
          </div>
          <RouterLink class="text-link" to="/games">{{ copy.all }}</RouterLink>
        </div>
        <div class="feature-list">
          <RouterLink
            v-for="game in recommendationGames"
            :key="game.id"
            class="feature-link"
            :to="`/games/${game.slug}`"
          >
            <span>{{ getLocalizedGameCopy(game).title }}</span>
            <small>{{ getLocalizedGameCopy(game).shortDescription }}</small>
          </RouterLink>
        </div>
      </section>
    </div>

    <section class="content-shell section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Catalog</p>
          <h2>{{ copy.todayGames }}</h2>
        </div>
        <div class="chip-row">
          <span v-for="category in gameStore.categories" :key="category" class="soft-chip">{{ category }}</span>
        </div>
      </div>
      <GameGrid :games="firstGridGames" />
      <AdSlot page="home" position="in-feed" />
      <GameGrid :games="remainingGames" />
    </section>

    <section class="content-shell two-column-panel">
      <article class="info-panel">
        <p class="eyebrow">Daily top 10</p>
        <h2>{{ copy.dailyTop }}</h2>
        <LeaderboardTable :items="dailyTop" />
      </article>
      <article class="info-panel">
        <p class="eyebrow">Recent activity</p>
        <h2>{{ copy.recent }}</h2>
        <div class="feature-list">
          <RouterLink
            v-for="game in gameStore.recentGames.length ? gameStore.recentGames : gameStore.games.slice(0, 3)"
            :key="game.id"
            class="feature-link"
            :to="`/games/${game.slug}`"
          >
            <span>{{ getLocalizedGameCopy(game).title }}</span>
            <small>{{ game.tags.join(' · ') }}</small>
          </RouterLink>
        </div>
      </article>
    </section>
  </section>
</template>

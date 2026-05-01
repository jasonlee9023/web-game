<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import AdSlot from '@/components/ads/AdSlot.vue';
import GameGrid from '@/components/game/GameGrid.vue';
import { currentLanguage } from '@/i18n/language';
import { getLocalizedGameCopy, getLocalizedInputLabel, getLocalizedModeLabel } from '@/i18n/game-copy';
import LeaderboardTable from '@/components/ranking/LeaderboardTable.vue';
import { useGameStore } from '@/stores/game.store';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';
import { formatCompact, formatScore } from '@/utils/format';

const route = useRoute();
const gameStore = useGameStore();
const rankingStore = useRankingStore();
const localizedGame = computed(() => (gameStore.currentGame ? getLocalizedGameCopy(gameStore.currentGame) : null));
const copy = computed(() => ({
  gameDetail: currentLanguage.value === 'en' ? 'Game Detail' : '게임 상세',
  plays: currentLanguage.value === 'en' ? 'Plays' : '플레이 수',
  bestScore: currentLanguage.value === 'en' ? 'All-time Best' : '전체 최고점',
  averageSession: currentLanguage.value === 'en' ? 'Average Session' : '평균 세션',
  seconds: currentLanguage.value === 'en' ? 'sec' : '초',
  playNow: currentLanguage.value === 'en' ? 'Play Now' : '지금 플레이',
  ranking: currentLanguage.value === 'en' ? 'View Rankings' : '랭킹 보기',
  todaysRanking: currentLanguage.value === 'en' ? 'Today’s Ranking' : '오늘의 랭킹',
  howToPlay: currentLanguage.value === 'en' ? 'How to Play' : '게임 방법',
  controls: currentLanguage.value === 'en' ? 'Controls' : '조작 입력',
  scoreMode: currentLanguage.value === 'en' ? 'Score Mode' : '점수 모드',
  rankingRule: currentLanguage.value === 'en' ? 'Ranking Rule' : '랭킹 기준',
  higherBetter: currentLanguage.value === 'en' ? 'Higher score first' : '높은 점수 우선',
  lowerBetter: currentLanguage.value === 'en' ? 'Lower score first' : '낮은 점수 우선',
  related: currentLanguage.value === 'en' ? 'Related Games' : '같이 보면 좋은 게임',
}));

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
        <img class="detail-banner" :src="gameStore.currentGame.bannerUrl" :alt="localizedGame?.title" />
        <p class="eyebrow">{{ copy.gameDetail }}</p>
        <h1>{{ localizedGame?.title }}</h1>
        <p class="lead">{{ localizedGame?.shortDescription }}</p>
        <div class="chip-row">
          <span v-for="tag in gameStore.currentGame.tags" :key="tag" class="soft-chip">{{ tag }}</span>
        </div>
        <div class="metric-strip">
          <article>
            <strong>{{ formatCompact(gameStore.currentGame.playCount) }}</strong>
            <span>{{ copy.plays }}</span>
          </article>
          <article>
            <strong>{{ formatScore(gameStore.currentGame.bestScore) }}</strong>
            <span>{{ copy.bestScore }}</span>
          </article>
          <article>
            <strong>{{ gameStore.currentGame.averageSessionSeconds }}{{ copy.seconds }}</strong>
            <span>{{ copy.averageSession }}</span>
          </article>
        </div>
        <div class="hero-actions">
          <RouterLink class="pill-button" :to="`/games/${gameStore.currentGame.slug}/play`">{{ copy.playNow }}</RouterLink>
          <RouterLink class="pill-button quiet" :to="`/games/${gameStore.currentGame.slug}/ranking`">{{ copy.ranking }}</RouterLink>
        </div>
      </article>

      <aside class="detail-side">
        <AdSlot page="game-detail" position="right-rail" :game-slug="gameStore.currentGame.slug" />
        <article class="info-panel">
          <p class="eyebrow">Today Top 5</p>
          <h2>{{ copy.todaysRanking }}</h2>
          <LeaderboardTable :items="rankingStore.ranking?.items.slice(0, 5) ?? []" />
        </article>
      </aside>
    </div>

    <section class="info-panel">
      <p class="eyebrow">How to play</p>
      <h2>{{ copy.howToPlay }}</h2>
      <p>{{ localizedGame?.description }}</p>
      <ul class="plain-list">
        <li>{{ copy.controls }}: {{ gameStore.currentGame.inputs.map((input) => getLocalizedInputLabel(input)).join(', ') }}</li>
        <li>{{ copy.scoreMode }}: {{ gameStore.currentGame.modes.map((mode) => getLocalizedModeLabel(mode)).join(', ') }}</li>
        <li>{{ copy.rankingRule }}: {{ gameStore.currentGame.scoreOrder === 'higher_better' ? copy.higherBetter : copy.lowerBetter }}</li>
      </ul>
    </section>

    <AdSlot page="game-detail" position="mid-content" :game-slug="gameStore.currentGame.slug" />

    <section class="section-stack">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Related Games</p>
          <h2>{{ copy.related }}</h2>
        </div>
      </div>
      <GameGrid :games="gameStore.relatedGames" />
    </section>
  </section>
</template>

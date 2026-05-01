<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import type { RankingPeriod } from '@casual-game-world/shared';

import AdSlot from '@/components/ads/AdSlot.vue';
import RankingFilter from '@/components/ranking/RankingFilter.vue';
import LeaderboardTable from '@/components/ranking/LeaderboardTable.vue';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';

const rankingStore = useRankingStore();
const period = ref<RankingPeriod>('weekly');

onMounted(async () => {
  applySeo({
    title: '글로벌 랭킹',
    description: '오늘, 주간, 월간 기준으로 게임별 상위 랭킹을 모아보는 글로벌 랭킹 페이지',
  });
  await rankingStore.loadGlobalRanking(period.value);
});

watch(period, () => {
  void rankingStore.loadGlobalRanking(period.value);
});
</script>

<template>
  <section class="content-shell page-stack">
    <header class="page-hero compact">
      <p class="eyebrow">Global rankings</p>
      <h1>전체 랭킹</h1>
      <p>게임별 상위 기록을 한 번에 확인하고, 바로 플레이 흐름으로 이동할 수 있습니다.</p>
    </header>

    <RankingFilter v-model:period="period" mode="normal" :modes="['normal']" />

    <AdSlot page="global-ranking" position="mid-content" />

    <div class="two-column-panel">
      <article v-for="bucket in rankingStore.globalRanking?.buckets ?? []" :key="bucket.gameSlug" class="info-panel">
        <div class="section-heading tight">
          <div>
            <p class="eyebrow">Top scores</p>
            <h2>{{ bucket.gameTitle }}</h2>
          </div>
          <RouterLink class="text-link" :to="`/games/${bucket.gameSlug}/play`">플레이</RouterLink>
        </div>
        <LeaderboardTable :items="bucket.items" />
      </article>
    </div>
  </section>
</template>

import { ref } from 'vue';
import { defineStore } from 'pinia';

import type { GlobalRankingResponse, RankingFilter, RankingResponse, ScoreRecord } from '@casual-game-world/shared';

import { fetchGameRanking, fetchGlobalRanking, fetchMyScores } from '@/api/rankings.api';

export const useRankingStore = defineStore('ranking', () => {
  const ranking = ref<RankingResponse | null>(null);
  const globalRanking = ref<GlobalRankingResponse | null>(null);
  const myScores = ref<Array<ScoreRecord & { game?: { title: string; slug: string } }>>([]);
  const loading = ref(false);

  async function loadGameRanking(slug: string, filter: RankingFilter) {
    loading.value = true;
    try {
      ranking.value = await fetchGameRanking(slug, filter);
      return ranking.value;
    } finally {
      loading.value = false;
    }
  }

  async function loadGlobalRanking(period: RankingFilter['period']) {
    globalRanking.value = await fetchGlobalRanking(period);
    return globalRanking.value;
  }

  async function loadMyScores() {
    myScores.value = await fetchMyScores();
    return myScores.value;
  }

  return {
    ranking,
    globalRanking,
    myScores,
    loading,
    loadGameRanking,
    loadGlobalRanking,
    loadMyScores,
  };
});


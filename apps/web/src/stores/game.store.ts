import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { GameCatalogItem } from '@casual-game-world/shared';

import { fetchGame, fetchGames, fetchRelatedGames } from '@/api/games.api';

const RECENT_KEY = 'cgw-recent-games';

export const useGameStore = defineStore('games', () => {
  const games = ref<GameCatalogItem[]>([]);
  const currentGame = ref<GameCatalogItem | null>(null);
  const relatedGames = ref<GameCatalogItem[]>([]);
  const loading = ref(false);
  const recentSlugs = ref<string[]>(JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'));

  const featuredGames = computed(() => games.value.filter((game) => game.featured));
  const categories = computed(() => Array.from(new Set(games.value.flatMap((game) => game.categories))));
  const recentGames = computed(() => recentSlugs.value.map((slug) => games.value.find((game) => game.slug === slug)).filter(Boolean) as GameCatalogItem[]);

  async function loadGames(params?: { search?: string; category?: string }) {
    loading.value = true;
    try {
      games.value = await fetchGames(params);
      return games.value;
    } finally {
      loading.value = false;
    }
  }

  async function loadGame(slug: string) {
    currentGame.value = await fetchGame(slug);
    addRecent(slug);
    return currentGame.value;
  }

  async function loadRelated(slug: string) {
    relatedGames.value = await fetchRelatedGames(slug);
    return relatedGames.value;
  }

  function addRecent(slug: string) {
    recentSlugs.value = [slug, ...recentSlugs.value.filter((item) => item !== slug)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentSlugs.value));
  }

  return {
    games,
    currentGame,
    relatedGames,
    loading,
    featuredGames,
    categories,
    recentGames,
    loadGames,
    loadGame,
    loadRelated,
    addRecent,
  };
});


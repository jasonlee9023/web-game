import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { AdPage, AdPosition, AdSlotConfig } from '@casual-game-world/shared';

import { fetchAdConfig } from '@/api/ads.api';

export const useAdStore = defineStore('ads', () => {
  const slots = ref<Record<string, AdSlotConfig[]>>({});

  function key(page: AdPage, gameSlug?: string) {
    return `${page}:${gameSlug ?? 'all'}`;
  }

  async function load(page: AdPage, gameSlug?: string) {
    const cacheKey = key(page, gameSlug);
    if (!slots.value[cacheKey]) {
      slots.value[cacheKey] = await fetchAdConfig(page, gameSlug);
    }
    return slots.value[cacheKey];
  }

  const getSlot = computed(() => (page: AdPage, position: AdPosition, gameSlug?: string) => {
    return slots.value[key(page, gameSlug)]?.find((slot) => slot.position === position);
  });

  return {
    slots,
    load,
    getSlot,
  };
});


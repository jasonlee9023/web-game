<script setup lang="ts">
import type { GameMode, RankingPeriod } from '@casual-game-world/shared';

defineProps<{
  period: RankingPeriod;
  mode: GameMode;
  modes: GameMode[];
}>();

const emit = defineEmits<{
  'update:period': [value: RankingPeriod];
  'update:mode': [value: GameMode];
}>();

const periods: RankingPeriod[] = ['daily', 'weekly', 'monthly', 'all'];
</script>

<template>
  <div class="filter-bar">
    <div class="chip-group">
      <button
        v-for="item in periods"
        :key="item"
        class="filter-chip"
        :class="{ active: period === item }"
        @click="emit('update:period', item)"
      >
        {{ item }}
      </button>
    </div>
    <div class="chip-group">
      <button
        v-for="item in modes"
        :key="item"
        class="filter-chip"
        :class="{ active: mode === item }"
        @click="emit('update:mode', item)"
      >
        {{ item }}
      </button>
    </div>
  </div>
</template>


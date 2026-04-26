<script setup lang="ts">
import type { GameCatalogItem } from '@casual-game-world/shared';

import GameCard from './GameCard.vue';

defineProps<{
  games: GameCatalogItem[];
}>();
</script>

<template>
  <div class="game-grid">
    <GameCard v-for="game in games" :key="game.id" :game="game" />
  </div>
</template>


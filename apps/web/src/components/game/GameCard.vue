<script setup lang="ts">
import type { GameCatalogItem } from '@casual-game-world/shared';

import { formatCompact, formatScore } from '@/utils/format';

defineProps<{
  game: GameCatalogItem;
}>();
</script>

<template>
  <article class="game-card">
    <RouterLink
      class="game-card-media game-card-media-link"
      :to="`/games/${game.slug}/play`"
      :aria-label="`${game.title} 플레이`"
    >
      <img class="game-card-image" :src="game.thumbnailUrl" :alt="game.title" />
      <span class="game-card-badge">{{ game.engineType }}</span>
    </RouterLink>
    <div class="game-card-body">
      <div class="game-card-topline">
        <span class="game-card-category">{{ game.categories[0] }}</span>
        <span class="game-card-version">v{{ game.version }}</span>
      </div>
      <h3>{{ game.title }}</h3>
      <p>{{ game.shortDescription }}</p>
      <div class="tag-row">
        <span v-for="tag in game.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
      </div>
      <div class="game-card-metrics">
        <span><b>{{ formatCompact(game.playCount) }}</b> 플레이</span>
        <span><b>{{ formatScore(game.bestScore) }}</b> 최고점</span>
      </div>
      <div class="game-card-actions">
        <RouterLink class="pill-button quiet" :to="`/games/${game.slug}`">상세</RouterLink>
        <RouterLink class="pill-button" :to="`/games/${game.slug}/play`">바로 플레이</RouterLink>
      </div>
    </div>
  </article>
</template>

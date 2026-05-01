<script setup lang="ts">
import { computed } from 'vue';
import type { GameCatalogItem } from '@casual-game-world/shared';

import { currentLanguage } from '@/i18n/language';
import { getLocalizedGameCopy } from '@/i18n/game-copy';
import { formatCompact, formatScore } from '@/utils/format';

const props = defineProps<{
  game: GameCatalogItem;
}>();

const localizedGame = computed(() => getLocalizedGameCopy(props.game));
const copy = computed(() => ({
  playAria: currentLanguage.value === 'en' ? `Play ${localizedGame.value.title}` : `${localizedGame.value.title} 플레이`,
  plays: currentLanguage.value === 'en' ? 'plays' : '플레이',
  bestScore: currentLanguage.value === 'en' ? 'best' : '최고점',
  detail: currentLanguage.value === 'en' ? 'Details' : '상세',
  playNow: currentLanguage.value === 'en' ? 'Play Now' : '바로 플레이',
}));
</script>

<template>
  <article class="game-card">
    <RouterLink
      class="game-card-media game-card-media-link"
      :to="`/games/${game.slug}/play`"
      :aria-label="copy.playAria"
    >
      <img class="game-card-image" :src="game.thumbnailUrl" :alt="localizedGame.title" />
      <span class="game-card-badge">{{ game.engineType }}</span>
    </RouterLink>
    <div class="game-card-body">
      <div class="game-card-topline">
        <span class="game-card-category">{{ game.categories[0] }}</span>
        <span class="game-card-version">v{{ game.version }}</span>
      </div>
      <h3>{{ localizedGame.title }}</h3>
      <p>{{ localizedGame.shortDescription }}</p>
      <div class="tag-row">
        <span v-for="tag in game.tags.slice(0, 3)" :key="tag">{{ tag }}</span>
      </div>
      <div class="game-card-metrics">
        <span><b>{{ formatCompact(game.playCount) }}</b> {{ copy.plays }}</span>
        <span><b>{{ formatScore(game.bestScore) }}</b> {{ copy.bestScore }}</span>
      </div>
      <div class="game-card-actions">
        <RouterLink class="pill-button quiet" :to="`/games/${game.slug}`">{{ copy.detail }}</RouterLink>
        <RouterLink class="pill-button" :to="`/games/${game.slug}/play`">{{ copy.playNow }}</RouterLink>
      </div>
    </div>
  </article>
</template>

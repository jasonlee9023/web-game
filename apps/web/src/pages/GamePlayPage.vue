<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import GamePlayerShell from '@/components/game/GamePlayerShell.vue';
import { useGameStore } from '@/stores/game.store';
import { applySeo } from '@/utils/seo';

const route = useRoute();
const gameStore = useGameStore();

async function load() {
  const slug = route.params.slug.toString();
  const game = await gameStore.loadGame(slug);
  await gameStore.loadRelated(slug);
  applySeo({
    title: `${game.title} 플레이`,
    description: `${game.title}를 iframe 런타임에서 플레이하고 점수를 제출하는 화면`,
  });
}

onMounted(load);
watch(() => route.params.slug, () => {
  void load();
});
</script>

<template>
  <section v-if="gameStore.currentGame" class="content-shell page-stack play-page">
    <GamePlayerShell :game="gameStore.currentGame" :related-games="gameStore.relatedGames" />
  </section>
</template>


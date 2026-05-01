<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import AdSlot from '@/components/ads/AdSlot.vue';
import GameGrid from '@/components/game/GameGrid.vue';
import { currentLanguage } from '@/i18n/language';
import { useGameStore } from '@/stores/game.store';
import { applySeo } from '@/utils/seo';

const route = useRoute();
const gameStore = useGameStore();

const search = computed(() => route.query.search?.toString());
const category = computed(() => route.query.category?.toString());
const copy = computed(() => ({
  title: currentLanguage.value === 'en' ? 'Game Catalog' : '게임 목록',
  description:
    currentLanguage.value === 'en'
      ? 'Browse ready-to-play Canvas and WebGL games by category and search keyword.'
      : '카테고리 필터와 검색어를 기준으로 바로 플레이 가능한 Canvas/WebGL 게임을 탐색합니다.',
  all: currentLanguage.value === 'en' ? 'All' : '전체',
}));

async function load() {
  await gameStore.loadGames({
    search: search.value,
    category: category.value,
  });
}

onMounted(async () => {
  applySeo({
    title: '게임 목록',
    description: '카테고리, 검색, 신규게임 탐색이 가능한 캐주얼 게임 목록 페이지',
  });
  await load();
});

watch([search, category], () => {
  void load();
});
</script>

<template>
  <section class="content-shell page-stack">
    <header class="page-hero compact">
      <p class="eyebrow">Game Catalog</p>
      <h1>{{ copy.title }}</h1>
      <p>{{ copy.description }}</p>
    </header>

    <div class="chip-row">
      <RouterLink class="soft-chip" to="/games">{{ copy.all }}</RouterLink>
      <RouterLink v-for="item in gameStore.categories" :key="item" class="soft-chip" :to="`/games?category=${item}`">
        {{ item }}
      </RouterLink>
    </div>

    <AdSlot page="game-list" position="in-feed" />

    <GameGrid :games="gameStore.games" />
  </section>
</template>

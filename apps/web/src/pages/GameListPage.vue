<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';

import GameGrid from '@/components/game/GameGrid.vue';
import { useGameStore } from '@/stores/game.store';
import { applySeo } from '@/utils/seo';

const route = useRoute();
const gameStore = useGameStore();

const search = computed(() => route.query.search?.toString());
const category = computed(() => route.query.category?.toString());

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
      <h1>게임 목록</h1>
      <p>카테고리 필터와 검색어를 기준으로 바로 플레이 가능한 Canvas/WebGL 게임을 탐색합니다.</p>
    </header>

    <div class="chip-row">
      <RouterLink class="soft-chip" to="/games">전체</RouterLink>
      <RouterLink v-for="item in gameStore.categories" :key="item" class="soft-chip" :to="`/games?category=${item}`">
        {{ item }}
      </RouterLink>
    </div>

    <GameGrid :games="gameStore.games" />
  </section>
</template>


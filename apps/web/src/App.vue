<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { RouterView, useRoute } from 'vue-router';

import { APP_NAME } from './app/app.config';
import AppFooter from './components/layout/AppFooter.vue';
import AppHeader from './components/layout/AppHeader.vue';
import MobileNav from './components/layout/MobileNav.vue';
import { useAuthStore } from './stores/auth.store';

const route = useRoute();
const authStore = useAuthStore();

const immersive = computed(() => Boolean(route.meta.immersive));

onMounted(() => {
  document.documentElement.style.setProperty('--app-name', `"${APP_NAME}"`);
  void authStore.initialize();
});
</script>

<template>
  <div class="app-shell" :class="{ 'is-immersive': immersive }">
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>
    <AppHeader :immersive="immersive" />
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter v-if="!immersive" />
    <MobileNav v-if="!immersive" />
  </div>
</template>


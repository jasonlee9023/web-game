<script setup lang="ts">
import { computed } from 'vue';

import { currentLanguage } from '@/i18n/language';

const copy = computed(() => ({
  home: currentLanguage.value === 'en' ? 'Home' : '홈',
  games: currentLanguage.value === 'en' ? 'Games' : '게임',
  rankings: currentLanguage.value === 'en' ? 'Rankings' : '랭킹',
  profile: currentLanguage.value === 'en' ? 'Profile' : '프로필',
}));
</script>

<template>
  <nav class="mobile-nav">
    <RouterLink to="/">{{ copy.home }}</RouterLink>
    <RouterLink to="/games">{{ copy.games }}</RouterLink>
    <RouterLink to="/rankings">{{ copy.rankings }}</RouterLink>
    <RouterLink to="/profile">{{ copy.profile }}</RouterLink>
  </nav>
</template>

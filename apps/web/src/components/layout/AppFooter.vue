<script setup lang="ts">
import { computed } from 'vue';

import { currentLanguage } from '@/i18n/language';

const copy = computed(() => ({
  eyebrow: currentLanguage.value === 'en' ? 'Play fast, fresh challenges daily' : '바로 플레이, 매일 새로운 도전',
  title: currentLanguage.value === 'en' ? 'Free casual games for short breaks' : '짧은 휴식에도 즐길 수 있는 무료 캐주얼 게임',
  description:
    currentLanguage.value === 'en'
      ? 'Start instantly without installing, save your best score, and challenge today’s rankings.'
      : '설치 없이 즉시 시작하고, 최고 점수를 기록하며, 오늘의 랭킹에 도전하세요.',
  allGames: currentLanguage.value === 'en' ? 'All Games' : '전체 게임',
  globalRankings: currentLanguage.value === 'en' ? 'Global Rankings' : '글로벌 랭킹',
  terms: currentLanguage.value === 'en' ? 'Terms' : '이용약관',
  privacy: currentLanguage.value === 'en' ? 'Privacy Policy' : '개인정보처리방침',
}));
</script>

<template>
  <footer class="app-footer">
    <div class="content-shell footer-grid">
      <section>
        <p class="eyebrow">{{ copy.eyebrow }}</p>
        <h3>{{ copy.title }}</h3>
        <p>{{ copy.description }}</p>
      </section>
      <section class="footer-links">
        <RouterLink to="/games">{{ copy.allGames }}</RouterLink>
        <RouterLink to="/rankings">{{ copy.globalRankings }}</RouterLink>
        <RouterLink to="/terms">{{ copy.terms }}</RouterLink>
        <RouterLink to="/privacy">{{ copy.privacy }}</RouterLink>
      </section>
    </div>
  </footer>
</template>

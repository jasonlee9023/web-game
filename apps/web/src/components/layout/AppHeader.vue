<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { NAV_ITEMS } from '@/app/app.config';
import { currentLanguage, setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/i18n/language';
import { useAuthStore } from '@/stores/auth.store';

const props = withDefaults(defineProps<{
  immersive?: boolean;
}>(), {
  immersive: false,
});

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const search = ref((route.query.search as string) ?? '');
const copy = computed(() => ({
  nav: {
    '/games': currentLanguage.value === 'en' ? 'Games' : '게임',
    '/rankings': currentLanguage.value === 'en' ? 'Rankings' : '랭킹',
    '/games?sort=new': currentLanguage.value === 'en' ? 'New Games' : '신규게임',
  } as Record<string, string>,
  admin: currentLanguage.value === 'en' ? 'Admin' : '관리자',
  searchPlaceholder: currentLanguage.value === 'en' ? 'Search games or tags' : '게임명 또는 태그 검색',
  gamesList: currentLanguage.value === 'en' ? 'Game List' : '게임 목록',
  login: currentLanguage.value === 'en' ? 'Log In' : '로그인',
  signup: currentLanguage.value === 'en' ? 'Sign Up' : '회원가입',
  languageLabel: currentLanguage.value === 'en' ? 'Language' : '언어',
}));
const navItems = computed(() => NAV_ITEMS.map((item) => ({ ...item, label: copy.value.nav[item.to] ?? item.label })));

function submitSearch() {
  router.push({ path: '/games', query: search.value ? { search: search.value } : {} });
}

function handleLanguageChange(event: Event) {
  const language = (event.target as HTMLSelectElement).value;
  if (language === 'ko' || language === 'en') {
    setLanguage(language as SupportedLanguage);
  }
}
</script>

<template>
  <header class="app-header" :class="{ 'is-immersive': props.immersive }">
    <div class="content-shell header-inner">
      <RouterLink class="brandmark" to="/">
        <span class="brandmark-kicker">PLAY FAST</span>
        <strong>Casual Game World</strong>
      </RouterLink>

      <nav v-if="!props.immersive" class="header-nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="header-link">
          {{ item.label }}
        </RouterLink>
        <RouterLink v-if="authStore.isAdmin" class="header-link" to="/admin">{{ copy.admin }}</RouterLink>
      </nav>

      <form v-if="!props.immersive" class="header-search" @submit.prevent="submitSearch">
        <input v-model="search" type="search" :placeholder="copy.searchPlaceholder" />
      </form>

      <div class="header-auth">
        <label class="language-picker" :aria-label="copy.languageLabel">
          <span>{{ copy.languageLabel }}</span>
          <select :value="currentLanguage" @change="handleLanguageChange">
            <option v-for="language in SUPPORTED_LANGUAGES" :key="language.code" :value="language.code">
              {{ language.label }}
            </option>
          </select>
        </label>
        <RouterLink v-if="props.immersive" class="header-link" to="/games">{{ copy.gamesList }}</RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated" class="pill-button quiet" to="/login">{{ copy.login }}</RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated" class="pill-button" to="/signup">{{ copy.signup }}</RouterLink>
        <RouterLink v-else class="profile-chip" to="/profile">
          <span class="status-dot"></span>
          {{ authStore.user?.displayName }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>

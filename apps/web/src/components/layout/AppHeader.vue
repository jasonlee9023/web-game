<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { NAV_ITEMS } from '@/app/app.config';
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

function submitSearch() {
  router.push({ path: '/games', query: search.value ? { search: search.value } : {} });
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
        <RouterLink v-for="item in NAV_ITEMS" :key="item.to" :to="item.to" class="header-link">
          {{ item.label }}
        </RouterLink>
        <RouterLink v-if="authStore.isAdmin" class="header-link" to="/admin">관리자</RouterLink>
      </nav>

      <form v-if="!props.immersive" class="header-search" @submit.prevent="submitSearch">
        <input v-model="search" type="search" placeholder="게임명 또는 태그 검색" />
      </form>

      <div class="header-auth">
        <RouterLink v-if="props.immersive" class="header-link" to="/games">게임 목록</RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated" class="pill-button quiet" to="/login">로그인</RouterLink>
        <RouterLink v-if="!authStore.isAuthenticated" class="pill-button" to="/signup">회원가입</RouterLink>
        <RouterLink v-else class="profile-chip" to="/profile">
          <span class="status-dot"></span>
          {{ authStore.user?.displayName }}
        </RouterLink>
      </div>
    </div>
  </header>
</template>

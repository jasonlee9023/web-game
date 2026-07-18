import { createRouter, createWebHistory } from 'vue-router';

import { pinia } from './pinia';
import { useAuthStore } from '@/stores/auth.store';
import GameDetailPage from '@/pages/GameDetailPage.vue';
import GameListPage from '@/pages/GameListPage.vue';
import GamePlayPage from '@/pages/GamePlayPage.vue';
import GlobalRankingPage from '@/pages/GlobalRankingPage.vue';
import HomePage from '@/pages/HomePage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import PrivacyPage from '@/pages/PrivacyPage.vue';
import ProfilePage from '@/pages/ProfilePage.vue';
import RankingPage from '@/pages/RankingPage.vue';
import SignupPage from '@/pages/SignupPage.vue';
import TermsPage from '@/pages/TermsPage.vue';
import AdminPage from '@/pages/AdminPage.vue';
import AdminGameManagePage from '@/pages/AdminGameManagePage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/games', component: GameListPage },
    { path: '/games/:slug', component: GameDetailPage },
    { path: '/games/:slug/play', component: GamePlayPage, meta: { immersive: true } },
    { path: '/games/:slug/ranking', component: RankingPage },
    { path: '/rankings', component: GlobalRankingPage },
    { path: '/login', component: LoginPage },
    { path: '/signup', component: SignupPage },
    { path: '/profile', component: ProfilePage, meta: { requiresAuth: true } },
    { path: '/terms', component: TermsPage },
    { path: '/privacy', component: PrivacyPage },
    { path: '/admin', component: AdminPage, meta: { requiresAdmin: true } },
    { path: '/admin/games/:slug', component: AdminGameManagePage, meta: { requiresAdmin: true } },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  if (to.path.startsWith('/games/dungeon-quest')) {
    return {
      path: to.path.replace('/games/dungeon-quest', '/games/hero-journey'),
      query: to.query,
      hash: to.hash,
    };
  }

  const authStore = useAuthStore(pinia);
  await authStore.initialize();

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  return true;
});

import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { AuthUser, LoginInput, SignupInput } from '@casual-game-world/shared';

import { login, logout, me, signup, updateMe } from '@/api/auth.api';
import { clearAccessToken, setAccessToken } from '@/api/http';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null);
  const ready = ref(false);
  const loading = ref(false);

  const isAuthenticated = computed(() => Boolean(user.value));
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function initialize() {
    if (ready.value) {
      return;
    }

    try {
      user.value = await me();
    } catch {
      user.value = null;
      clearAccessToken();
    } finally {
      ready.value = true;
    }
  }

  async function signIn(payload: LoginInput) {
    loading.value = true;
    try {
      const response = await login(payload);
      setAccessToken(response.accessToken);
      user.value = response.user;
    } finally {
      loading.value = false;
    }
  }

  async function signUp(payload: SignupInput) {
    loading.value = true;
    try {
      const response = await signup(payload);
      setAccessToken(response.accessToken);
      user.value = response.user;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    await logout();
    clearAccessToken();
    user.value = null;
  }

  async function updateProfile(displayName: string) {
    user.value = await updateMe(displayName);
  }

  return {
    user,
    ready,
    loading,
    isAuthenticated,
    isAdmin,
    initialize,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
});


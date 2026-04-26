<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LoginModal from '@/components/auth/LoginModal.vue';
import { DEMO_CREDENTIALS } from '@/app/app.config';
import { useAuthStore } from '@/stores/auth.store';
import { applySeo } from '@/utils/seo';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const error = ref('');

async function handleSubmit(payload: { email: string; password: string }) {
  error.value = '';

  try {
    await authStore.signIn(payload);
    await router.push(route.query.redirect?.toString() ?? '/profile');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '로그인에 실패했습니다.';
  }
}

onMounted(() => {
  applySeo({
    title: '로그인',
    description: '점수 저장, 랭킹 등록, 관리자 기능 접근을 위한 로그인 페이지',
  });
});
</script>

<template>
  <section class="auth-layout content-shell">
    <LoginModal
      :loading="authStore.loading"
      :default-email="DEMO_CREDENTIALS.user.email"
      :default-password="DEMO_CREDENTIALS.user.password"
      @submit="handleSubmit"
    />
    <aside class="info-panel">
      <p class="eyebrow">Demo accounts</p>
      <h2>바로 검증할 수 있는 계정</h2>
      <ul class="plain-list">
        <li>일반 사용자: {{ DEMO_CREDENTIALS.user.email }} / {{ DEMO_CREDENTIALS.user.password }}</li>
        <li>관리자: {{ DEMO_CREDENTIALS.admin.email }} / {{ DEMO_CREDENTIALS.admin.password }}</li>
      </ul>
      <p v-if="error" class="error-text">{{ error }}</p>
    </aside>
  </section>
</template>


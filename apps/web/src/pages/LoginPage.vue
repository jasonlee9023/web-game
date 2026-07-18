<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LoginModal from '@/components/auth/LoginModal.vue';
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
      @submit="handleSubmit"
    />
    <aside class="info-panel">
      <p class="eyebrow">Account</p>
      <h2>등록된 계정으로 로그인</h2>
      <p class="lead">관리자 계정 정보는 화면에 노출하지 않습니다. 필요한 계정은 서버 seed 또는 운영 환경 설정에서 관리합니다.</p>
      <p v-if="error" class="error-text">{{ error }}</p>
    </aside>
  </section>
</template>

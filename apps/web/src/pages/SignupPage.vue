<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import SignupModal from '@/components/auth/SignupModal.vue';
import { useAuthStore } from '@/stores/auth.store';
import { applySeo } from '@/utils/seo';

const authStore = useAuthStore();
const router = useRouter();
const error = ref('');

async function handleSubmit(payload: { displayName: string; email: string; password: string }) {
  error.value = '';

  try {
    await authStore.signUp(payload);
    await router.push('/profile');
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '회원가입에 실패했습니다.';
  }
}

onMounted(() => {
  applySeo({
    title: '회원가입',
    description: '닉네임, 이메일, 비밀번호로 계정을 만들고 점수 저장을 활성화하는 페이지',
  });
});
</script>

<template>
  <section class="auth-layout content-shell">
    <SignupModal :loading="authStore.loading" @submit="handleSubmit" />
    <aside class="info-panel">
      <p class="eyebrow">Why account?</p>
      <h2>로그인 없는 플레이는 유지하고, 저장은 계정으로 묶습니다.</h2>
      <ul class="plain-list">
        <li>랭킹 등록과 프로필별 최고점 저장</li>
        <li>향후 즐겨찾기, 최근 플레이, 시즌 랭킹 확장 가능</li>
        <li>비회원 유입 손실 없이 게임 오버 화면에서 자연스러운 전환</li>
      </ul>
      <p v-if="error" class="error-text">{{ error }}</p>
    </aside>
  </section>
</template>


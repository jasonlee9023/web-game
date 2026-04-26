<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  loading?: boolean;
}>();

const emit = defineEmits<{
  submit: [{ displayName: string; email: string; password: string }];
}>();

const form = reactive({
  displayName: '',
  email: '',
  password: '',
});
</script>

<template>
  <form class="auth-card" @submit.prevent="emit('submit', { ...form })">
    <span class="eyebrow">SIGN UP</span>
    <h2>비회원 플레이를 계정 기반 랭킹으로 전환하세요</h2>
    <label>
      닉네임
      <input v-model="form.displayName" type="text" required minlength="2" />
    </label>
    <label>
      이메일
      <input v-model="form.email" type="email" required />
    </label>
    <label>
      비밀번호
      <input v-model="form.password" type="password" required minlength="8" />
    </label>
    <button class="pill-button submit" :disabled="loading">{{ loading ? '처리 중...' : '회원가입' }}</button>
  </form>
</template>


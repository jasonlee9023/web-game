<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  loading?: boolean;
  defaultEmail?: string;
  defaultPassword?: string;
}>();

const emit = defineEmits<{
  submit: [{ email: string; password: string }];
}>();

const form = reactive({
  email: props.defaultEmail ?? '',
  password: props.defaultPassword ?? '',
});
</script>

<template>
  <form class="auth-card" @submit.prevent="emit('submit', { ...form })">
    <span class="eyebrow">LOGIN</span>
    <h2>점수 저장과 랭킹 등록을 시작하세요</h2>
    <label>
      이메일
      <input v-model="form.email" type="email" required />
    </label>
    <label>
      비밀번호
      <input v-model="form.password" type="password" required minlength="8" />
    </label>
    <button class="pill-button submit" :disabled="loading">{{ loading ? '처리 중...' : '로그인' }}</button>
  </form>
</template>


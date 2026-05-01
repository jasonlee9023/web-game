<script setup lang="ts">
import { computed } from 'vue';

import { currentLanguage } from '@/i18n/language';

defineProps<{
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  trigger: [];
}>();

const copy = computed(() => ({
  loading: currentLanguage.value === 'en' ? 'Preparing ad...' : '광고 준비 중...',
  continue: currentLanguage.value === 'en' ? 'Watch Ad to Continue' : '광고 보고 1회 이어하기',
}));
</script>

<template>
  <button class="reward-button" :disabled="disabled || loading" @click="emit('trigger')">
    <span v-if="loading">{{ copy.loading }}</span>
    <span v-else>{{ copy.continue }}</span>
  </button>
</template>

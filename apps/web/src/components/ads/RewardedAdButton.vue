<script setup lang="ts">
defineProps<{
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  trigger: [];
}>();
</script>

<template>
  <button class="reward-button" :disabled="disabled || loading" @click="emit('trigger')">
    <span v-if="loading">광고 준비 중...</span>
    <span v-else>광고 보고 1회 이어하기</span>
  </button>
</template>


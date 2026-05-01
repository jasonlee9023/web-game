<script setup lang="ts">
import { computed } from 'vue';

import { formatScore } from '@/utils/format';
import RewardedAdButton from '@/components/ads/RewardedAdButton.vue';

const props = defineProps<{
  visible: boolean;
  score: number;
  myBest?: number;
  rank?: number | null;
  signedIn: boolean;
  metadata?: Record<string, unknown>;
  rewardAvailable?: boolean;
  rewardLoading?: boolean;
  finalized?: boolean;
}>();

const emit = defineEmits<{
  replay: [];
  ranking: [];
  login: [];
  reward: [];
  close: [];
}>();

const resultReason = computed(() => (typeof props.metadata?.reason === 'string' ? props.metadata.reason : ''));
const resultTone = computed(() => {
  if (!props.finalized) {
    return 'continue';
  }
  return resultReason.value === 'escaped' ? 'victory' : 'defeat';
});
const headline = computed(() => {
  if (!props.finalized) {
    return '아직 끝나지 않았습니다';
  }
  if (resultReason.value === 'escaped') {
    return '던전 클리어';
  }
  if (resultReason.value === 'timer') {
    return '시간 종료';
  }
  if (resultReason.value === 'defeated') {
    return '전투 불능';
  }
  return '게임 종료';
});
const subtitle = computed(() => {
  if (!props.finalized) {
    return '광고 보상으로 한 번 더 이어서 도전할 수 있습니다.';
  }
  if (resultReason.value === 'escaped') {
    return '탈출에 성공했습니다. 전리품과 점수가 랭킹에 기록됩니다.';
  }
  if (resultReason.value === 'timer') {
    return '제한 시간이 끝났습니다. 더 빠른 루트로 다시 도전하세요.';
  }
  if (resultReason.value === 'defeated') {
    return '수호자에게 쓰러졌습니다. 장비와 동선을 다시 잡아보세요.';
  }
  return '이번 도전의 결과가 기록되었습니다.';
});
const resultLabel = computed(() => {
  if (!props.finalized) {
    return 'REVIVE';
  }
  return resultReason.value === 'escaped' ? 'CLEAR' : 'GAME OVER';
});
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card gameover-card" :data-result="resultTone">
      <span class="gameover-badge">{{ resultLabel }}</span>
      <div class="gameover-heading">
        <span class="eyebrow">RUN SUMMARY</span>
        <h3>{{ headline }}</h3>
        <p>{{ subtitle }}</p>
      </div>
      <div class="gameover-score">
        <span>점수</span>
        <strong>{{ formatScore(score) }}</strong>
      </div>
      <div class="stats-grid">
        <article>
          <span>내 최고 기록</span>
          <strong>{{ formatScore(myBest ?? score) }}</strong>
        </article>
        <article>
          <span>예상 순위</span>
          <strong>{{ rank ? `${rank}위` : '--' }}</strong>
        </article>
      </div>

      <p v-if="!signedIn" class="soft-banner">로그인하면 점수가 프로필과 랭킹에 안정적으로 저장됩니다.</p>

      <div class="modal-actions">
        <RewardedAdButton v-if="rewardAvailable" :loading="rewardLoading" @trigger="emit('reward')" />
        <button class="pill-button quiet" @click="emit('ranking')">랭킹 보기</button>
        <button class="pill-button" @click="emit('replay')">다시하기</button>
        <button v-if="!signedIn" class="text-link" @click="emit('login')">로그인하고 점수 저장</button>
      </div>
    </div>
  </div>
</template>

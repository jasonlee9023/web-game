<script setup lang="ts">
import { computed } from 'vue';

import { formatScore } from '@/utils/format';
import RewardedAdButton from '@/components/ads/RewardedAdButton.vue';
import { currentLanguage } from '@/i18n/language';

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
const copy = computed(() => ({
  notFinalizedHeadline: currentLanguage.value === 'en' ? 'Not Over Yet' : '아직 끝나지 않았습니다',
  clearHeadline: currentLanguage.value === 'en' ? 'Journey Complete' : '여정 완료',
  timerHeadline: currentLanguage.value === 'en' ? 'Time Up' : '시간 종료',
  defeatedHeadline: currentLanguage.value === 'en' ? 'Defeated' : '전투 불능',
  defaultHeadline: currentLanguage.value === 'en' ? 'Game Over' : '게임 종료',
  reviveSubtitle:
    currentLanguage.value === 'en'
      ? 'Watch a reward ad to continue this run one more time.'
      : '광고 보상으로 한 번 더 이어서 도전할 수 있습니다.',
  clearSubtitle:
    currentLanguage.value === 'en'
      ? 'You escaped. Loot and score are recorded on the rankings.'
      : '탈출에 성공했습니다. 전리품과 점수가 랭킹에 기록됩니다.',
  timerSubtitle:
    currentLanguage.value === 'en'
      ? 'The timer ran out. Try again with a faster route.'
      : '제한 시간이 끝났습니다. 더 빠른 루트로 다시 도전하세요.',
  defeatedSubtitle:
    currentLanguage.value === 'en'
      ? 'A guardian took you down. Adjust your gear and route, then try again.'
      : '수호자에게 쓰러졌습니다. 장비와 동선을 다시 잡아보세요.',
  defaultSubtitle: currentLanguage.value === 'en' ? 'This run result has been recorded.' : '이번 도전의 결과가 기록되었습니다.',
  score: currentLanguage.value === 'en' ? 'Score' : '점수',
  myBest: currentLanguage.value === 'en' ? 'My Best' : '내 최고 기록',
  expectedRank: currentLanguage.value === 'en' ? 'Estimated Rank' : '예상 순위',
  rankSuffix: currentLanguage.value === 'en' ? '#' : '위',
  loginBanner:
    currentLanguage.value === 'en'
      ? 'Log in to save scores reliably to your profile and rankings.'
      : '로그인하면 점수가 프로필과 랭킹에 안정적으로 저장됩니다.',
  ranking: currentLanguage.value === 'en' ? 'View Rankings' : '랭킹 보기',
  replay: currentLanguage.value === 'en' ? 'Replay' : '다시하기',
  loginSave: currentLanguage.value === 'en' ? 'Log In to Save Score' : '로그인하고 점수 저장',
}));
const headline = computed(() => {
  if (!props.finalized) {
    return copy.value.notFinalizedHeadline;
  }
  if (resultReason.value === 'escaped') {
    return copy.value.clearHeadline;
  }
  if (resultReason.value === 'timer') {
    return copy.value.timerHeadline;
  }
  if (resultReason.value === 'defeated') {
    return copy.value.defeatedHeadline;
  }
  return copy.value.defaultHeadline;
});
const subtitle = computed(() => {
  if (!props.finalized) {
    return copy.value.reviveSubtitle;
  }
  if (resultReason.value === 'escaped') {
    return copy.value.clearSubtitle;
  }
  if (resultReason.value === 'timer') {
    return copy.value.timerSubtitle;
  }
  if (resultReason.value === 'defeated') {
    return copy.value.defeatedSubtitle;
  }
  return copy.value.defaultSubtitle;
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
        <span>{{ copy.score }}</span>
        <strong>{{ formatScore(score) }}</strong>
      </div>
      <div class="stats-grid">
        <article>
          <span>{{ copy.myBest }}</span>
          <strong>{{ formatScore(myBest ?? score) }}</strong>
        </article>
        <article>
          <span>{{ copy.expectedRank }}</span>
          <strong>{{ rank ? (currentLanguage === 'en' ? `${copy.rankSuffix}${rank}` : `${rank}${copy.rankSuffix}`) : '--' }}</strong>
        </article>
      </div>

      <p v-if="!signedIn" class="soft-banner">{{ copy.loginBanner }}</p>

      <div class="modal-actions">
        <RewardedAdButton v-if="rewardAvailable" :loading="rewardLoading" @trigger="emit('reward')" />
        <button class="pill-button quiet" @click="emit('ranking')">{{ copy.ranking }}</button>
        <button class="pill-button" @click="emit('replay')">{{ copy.replay }}</button>
        <button v-if="!signedIn" class="text-link" @click="emit('login')">{{ copy.loginSave }}</button>
      </div>
    </div>
  </div>
</template>

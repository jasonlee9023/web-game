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

const headline = computed(() => (props.finalized ? '게임 오버' : '이어하기 제안'));
</script>

<template>
  <div v-if="visible" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card gameover-card">
      <span class="eyebrow">RUN SUMMARY</span>
      <h3>{{ headline }}</h3>
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


<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useAuthStore } from '@/stores/auth.store';
import { useRankingStore } from '@/stores/ranking.store';
import { applySeo } from '@/utils/seo';
import { formatDate, formatScore } from '@/utils/format';

const authStore = useAuthStore();
const rankingStore = useRankingStore();
const displayName = ref('');

async function save() {
  await authStore.updateProfile(displayName.value);
}

onMounted(async () => {
  applySeo({
    title: '프로필',
    description: '내 닉네임, 저장된 점수, 최근 기록을 확인하는 프로필 페이지',
  });
  displayName.value = authStore.user?.displayName ?? '';
  await rankingStore.loadMyScores();
});
</script>

<template>
  <section class="content-shell page-stack">
    <header class="page-hero compact">
      <p class="eyebrow">Profile</p>
      <h1>{{ authStore.user?.displayName }}</h1>
      <p>{{ authStore.user?.email }}</p>
    </header>

    <div class="two-column-panel">
      <article class="info-panel">
        <p class="eyebrow">Account</p>
        <h2>닉네임 관리</h2>
        <label class="stacked-label">
          닉네임
          <input v-model="displayName" type="text" />
        </label>
        <div class="hero-actions">
          <button class="pill-button" @click="save">저장</button>
          <button class="pill-button quiet" @click="authStore.signOut()">로그아웃</button>
        </div>
      </article>

      <article class="info-panel">
        <p class="eyebrow">Saved scores</p>
        <h2>내 점수 기록</h2>
        <div class="score-list">
          <div v-for="item in rankingStore.myScores" :key="item.id" class="score-row">
            <div>
              <strong>{{ item.game?.title ?? '게임' }}</strong>
              <span>{{ formatDate(item.submittedAt) }}</span>
            </div>
            <b>{{ formatScore(item.score) }}</b>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>


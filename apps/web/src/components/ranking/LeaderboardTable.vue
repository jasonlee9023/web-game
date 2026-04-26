<script setup lang="ts">
import type { RankingEntry } from '@casual-game-world/shared';

import { formatDate, formatScore } from '@/utils/format';

defineProps<{
  items: RankingEntry[];
}>();
</script>

<template>
  <div class="leaderboard-shell">
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>순위</th>
          <th>닉네임</th>
          <th>점수</th>
          <th>플레이 시간</th>
          <th>달성일</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.scoreId">
          <td>#{{ item.rank }}</td>
          <td>{{ item.displayName }}</td>
          <td>{{ formatScore(item.score) }}</td>
          <td>{{ Math.round(item.playTimeMs / 1000) }}초</td>
          <td>{{ formatDate(item.submittedAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>


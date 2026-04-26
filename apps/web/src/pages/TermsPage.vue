<script setup lang="ts">
import { onMounted } from 'vue';

import { applySeo } from '@/utils/seo';

onMounted(() => {
  applySeo({ title: '이용약관', description: '서비스 이용 정책과 책임 범위를 설명하는 페이지' });
});
</script>

<template>
  <section class="content-shell legal-page">
    <p class="eyebrow">Terms</p>
    <h1>이용약관</h1>
    <p>비회원 플레이는 허용되지만, 저장된 점수와 프로필 기능은 계정 상태에 따라 제공됩니다.</p>
    <p>게임 플레이를 방해하는 광고 배치, 조작 UI와 광고의 혼동 유도, 부정 점수 제출은 운영 정책에 따라 제한합니다.</p>
  </section>
</template>


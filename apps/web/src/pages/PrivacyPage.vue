<script setup lang="ts">
import { onMounted } from 'vue';

import { applySeo } from '@/utils/seo';

onMounted(() => {
  applySeo({ title: '개인정보처리방침', description: '로그인, 랭킹, 광고 이벤트 추적에 대한 데이터 사용 정책 페이지' });
});
</script>

<template>
  <section class="content-shell legal-page">
    <p class="eyebrow">Privacy</p>
    <h1>개인정보처리방침</h1>
    <p>이 MVP는 이메일, 닉네임, 로그인 상태, 점수 이벤트, 광고 노출 이벤트를 서비스 운영 목적으로 처리합니다.</p>
    <p>비회원은 guest id와 기기 수준 식별 정보로 임시 기록이 유지될 수 있으며, 추후 계정 전환 시 저장 흐름을 확장할 수 있습니다.</p>
  </section>
</template>


<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { createAdminGame, fetchAdminGames, fetchDashboard, publishGame } from '@/api/admin.api';
import { applySeo } from '@/utils/seo';

const summary = ref<{ games: number; publishedGames: number; scoresToday: number; activeAdSlots: number } | null>(null);
const games = ref<Array<{ id: string; title: string; slug: string; status: string; version: string }>>([]);
const saving = ref(false);
const form = reactive({
  slug: 'sky-burst',
  title: 'Sky Burst',
  shortDescription: '짧은 세션으로 즐기는 신규 액션 샘플 게임',
  description: '관리자 화면에서 신규 게임을 등록하기 위한 샘플 폼입니다. manifest와 광고/점수 정책 필드를 함께 입력하도록 구성했습니다.',
  version: '0.1.0',
  engineType: 'canvas',
  orientation: 'portrait',
  aspectRatio: '9:16',
  categories: '액션,신규',
  tags: '샘플,관리자,테스트',
  modes: 'normal,hard',
});

async function load() {
  summary.value = await fetchDashboard();
  games.value = await fetchAdminGames();
}

async function submit() {
  saving.value = true;
  try {
    const origin = window.location.origin;
    await createAdminGame({
      slug: form.slug,
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      thumbnailUrl: `https://placehold.co/800x450?text=${form.slug}`,
      bannerUrl: `https://placehold.co/1200x675?text=${form.title}`,
      entryUrl: `${origin}/games/${form.slug}/index.html`,
      version: form.version,
      engineType: form.engineType,
      orientation: form.orientation,
      aspectRatio: form.aspectRatio,
      inputs: ['touch', 'keyboard'],
      status: 'draft',
      scoreOrder: 'higher_better',
      categories: form.categories.split(',').map((item) => item.trim()),
      tags: form.tags.split(',').map((item) => item.trim()),
      modes: form.modes.split(',').map((item) => item.trim()),
      featured: false,
      validationRule: {
        minPlayTimeMs: 5000,
        maxScore: 50000,
        allowedModes: form.modes.split(',').map((item) => item.trim()),
      },
      relatedSlugs: [],
    });
    await load();
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  applySeo({
    title: '관리자',
    description: '게임 등록, 게시 상태 변경, 광고/랭킹 운영을 위한 관리자 페이지 MVP',
  });
  await load();
});
</script>

<template>
  <section class="content-shell page-stack">
    <header class="page-hero compact">
      <p class="eyebrow">Admin</p>
      <h1>운영 대시보드</h1>
      <p>게임 manifest, 게시 상태, 광고 슬롯 전략을 한 화면에서 관리하는 최소 관리자 UI입니다.</p>
    </header>

    <div class="metric-strip admin-metrics" v-if="summary">
      <article>
        <strong>{{ summary.games }}</strong>
        <span>전체 게임</span>
      </article>
      <article>
        <strong>{{ summary.publishedGames }}</strong>
        <span>게시중</span>
      </article>
      <article>
        <strong>{{ summary.scoresToday }}</strong>
        <span>오늘 점수</span>
      </article>
      <article>
        <strong>{{ summary.activeAdSlots }}</strong>
        <span>활성 광고 슬롯</span>
      </article>
    </div>

    <div class="two-column-panel">
      <form class="info-panel admin-form" @submit.prevent="submit">
        <p class="eyebrow">Quick register</p>
        <h2>신규 게임 등록</h2>
        <label class="stacked-label">slug <input v-model="form.slug" required /></label>
        <label class="stacked-label">title <input v-model="form.title" required /></label>
        <label class="stacked-label">shortDescription <input v-model="form.shortDescription" required /></label>
        <label class="stacked-label">description <textarea v-model="form.description" rows="4" required /></label>
        <label class="stacked-label">version <input v-model="form.version" required /></label>
        <label class="stacked-label">categories <input v-model="form.categories" required /></label>
        <label class="stacked-label">tags <input v-model="form.tags" required /></label>
        <label class="stacked-label">modes <input v-model="form.modes" required /></label>
        <button class="pill-button submit" :disabled="saving">{{ saving ? '저장 중...' : '게임 등록' }}</button>
      </form>

      <article class="info-panel">
        <p class="eyebrow">Catalog</p>
        <h2>게임 게시 상태</h2>
        <div class="score-list">
          <div v-for="game in games" :key="game.id" class="score-row">
            <div>
              <strong>{{ game.title }}</strong>
              <span>{{ game.slug }} · {{ game.version }} · {{ game.status }}</span>
            </div>
            <button class="pill-button quiet" @click="publishGame(game.id).then(load)">게시</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>


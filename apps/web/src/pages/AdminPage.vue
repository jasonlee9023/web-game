<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { createAdminGame, fetchAdminGames, fetchDashboard, publishGame, type AdminGameItem } from '@/api/admin.api';
import { applySeo } from '@/utils/seo';

const summary = ref<{ games: number; publishedGames: number; scoresToday: number; activeAdSlots: number } | null>(null);
const games = ref<AdminGameItem[]>([]);
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

function csv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

async function load() {
  const [dashboard, gameList] = await Promise.all([fetchDashboard(), fetchAdminGames()]);
  summary.value = dashboard;
  games.value = gameList;
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
      categories: csv(form.categories),
      tags: csv(form.tags),
      modes: csv(form.modes),
      featured: false,
      validationRule: {
        minPlayTimeMs: 5000,
        maxScore: 50000,
        allowedModes: csv(form.modes),
      },
      relatedSlugs: [],
    });
    await load();
  } finally {
    saving.value = false;
  }
}

async function publish(game: AdminGameItem) {
  await publishGame(game.id);
  await load();
}

onMounted(async () => {
  applySeo({
    title: '관리자',
    description: '게임 목록에서 각 게임의 운영 설정 화면으로 진입하는 관리자 대시보드',
  });
  await load();
});
</script>

<template>
  <section class="content-shell page-stack">
    <header class="page-hero compact">
      <p class="eyebrow">Admin</p>
      <h1>운영 대시보드</h1>
      <p>게임을 선택해 상세 관리 화면에서 운영 설정, 검증 정책, 전용 편집기를 관리합니다.</p>
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

    <section class="info-panel">
      <div class="section-heading tight">
        <div>
          <p class="eyebrow">Catalog</p>
          <h2>게임 관리</h2>
        </div>
      </div>
      <div class="score-list admin-game-list">
        <div v-for="game in games" :key="game.id" class="score-row admin-game-row">
          <div>
            <strong>{{ game.title }}</strong>
            <span>{{ game.slug }} · {{ game.version }} · {{ game.status }} · {{ game.engineType }}</span>
          </div>
          <div class="admin-row-actions">
            <button class="pill-button quiet" @click="publish(game)">게시</button>
            <RouterLink class="pill-button" :to="`/admin/games/${game.slug}`">관리</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <form class="info-panel admin-form" @submit.prevent="submit">
      <p class="eyebrow">Quick Register</p>
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
  </section>
</template>

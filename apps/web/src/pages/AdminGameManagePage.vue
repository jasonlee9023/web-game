<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createAdminHeroJourneyLevel,
  fetchAdminGames,
  fetchAdminHeroJourneyLevels,
  generateAdminHeroJourneyLevel,
  resetAdminHeroJourneyLevel,
  updateAdminGame,
  type AdminGameItem,
} from '@/api/admin.api';
import { applySeo } from '@/utils/seo';
import type { HeroJourneyBiome, HeroJourneyLevelSnapshot } from '@casual-game-world/shared';

type AdminSection = 'catalog' | 'runtime' | 'validation' | 'levels';

const route = useRoute();
const router = useRouter();
const games = ref<AdminGameItem[]>([]);
const levels = ref<HeroJourneyLevelSnapshot[]>([]);
const activeSection = ref<AdminSection>('catalog');
const selectedLevelId = ref('gate-hall');
const loading = ref(true);
const saving = ref(false);
const resettingLevel = ref(false);
const creatingLevel = ref(false);
const generatingLevel = ref(false);
const HERO_JOURNEY_EDITOR_STORAGE_KEY = 'hero-journey:level-editor:v1';

const form = reactive({
  title: '',
  shortDescription: '',
  description: '',
  thumbnailUrl: '',
  bannerUrl: '',
  entryUrl: '',
  status: 'draft',
  version: '',
  engineType: 'canvas',
  orientation: 'responsive',
  aspectRatio: '16:9',
  inputs: 'touch,keyboard',
  scoreOrder: 'higher_better',
  categories: '',
  tags: '',
  modes: 'normal',
  relatedSlugs: '',
  featured: false,
  minPlayTimeMs: 5000,
  maxScore: 50000,
});

const newLevel = reactive({
  nameKo: '',
  nameEn: '',
  biome: 'ruin',
});

const aiLevel = reactive({
  prompt: '',
  imageDataUrl: '',
  imageName: '',
  error: '',
});

const gameSlug = computed(() => route.params.slug?.toString() ?? '');
const game = computed(() => games.value.find((item) => item.slug === gameSlug.value) ?? null);
const selectedLevel = computed(() => levels.value.find((level) => level.id === selectedLevelId.value) ?? levels.value[0] ?? null);
const isHeroJourney = computed(() => game.value?.slug === 'hero-journey');
const canGenerateAiLevel = computed(() => Boolean(aiLevel.prompt.trim() || aiLevel.imageDataUrl) && !generatingLevel.value);
const sectionItems = computed(() => [
  { id: 'catalog' as const, label: '카탈로그' },
  { id: 'runtime' as const, label: '런타임' },
  { id: 'validation' as const, label: '점수/검증' },
  { id: 'levels' as const, label: isHeroJourney.value ? '레벨 저작' : '전용 도구' },
]);
const editorUrl = computed(() => {
  const levelId = selectedLevel.value?.id ?? 'gate-hall';
  return `/games/hero-journey/index.html?editor=1&mode=map&author=1&level=${encodeURIComponent(levelId)}`;
});

function csv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function syncForm(nextGame: AdminGameItem) {
  form.title = nextGame.title;
  form.shortDescription = nextGame.shortDescription;
  form.description = nextGame.description;
  form.thumbnailUrl = nextGame.thumbnailUrl;
  form.bannerUrl = nextGame.bannerUrl;
  form.entryUrl = nextGame.entryUrl;
  form.status = nextGame.status;
  form.version = nextGame.version;
  form.engineType = nextGame.engineType;
  form.orientation = nextGame.orientation;
  form.aspectRatio = nextGame.aspectRatio;
  form.inputs = nextGame.inputs.join(',');
  form.scoreOrder = nextGame.scoreOrder;
  form.categories = nextGame.categories.join(',');
  form.tags = nextGame.tags.join(',');
  form.modes = nextGame.modes.join(',');
  form.relatedSlugs = nextGame.relatedSlugs.join(',');
  form.featured = nextGame.featured;
  form.minPlayTimeMs = nextGame.validationRule.minPlayTimeMs;
  form.maxScore = nextGame.validationRule.maxScore;
}

async function load() {
  loading.value = true;
  try {
    const gameList = await fetchAdminGames();
    games.value = gameList;
    const current = gameList.find((item) => item.slug === gameSlug.value);
    if (!current) {
      await router.replace('/admin');
      return;
    }

    syncForm(current);
    if (current.slug === 'hero-journey') {
      levels.value = await fetchAdminHeroJourneyLevels();
      selectedLevelId.value = levels.value[0]?.id ?? 'gate-hall';
    }
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  if (!game.value) {
    return;
  }

  saving.value = true;
  try {
    const modes = csv(form.modes);
    const updated = await updateAdminGame(game.value.id, {
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      thumbnailUrl: form.thumbnailUrl,
      bannerUrl: form.bannerUrl,
      entryUrl: form.entryUrl,
      status: form.status,
      version: form.version,
      engineType: form.engineType,
      orientation: form.orientation,
      aspectRatio: form.aspectRatio,
      inputs: csv(form.inputs),
      scoreOrder: form.scoreOrder,
      categories: csv(form.categories),
      tags: csv(form.tags),
      modes,
      relatedSlugs: csv(form.relatedSlugs),
      featured: form.featured,
      validationRule: {
        minPlayTimeMs: Number(form.minPlayTimeMs),
        maxScore: Number(form.maxScore),
        allowedModes: modes,
      },
    });
    games.value = games.value.map((item) => (item.id === updated.id ? updated : item));
    syncForm(updated);
  } finally {
    saving.value = false;
  }
}

function clearLocalLevelDraft(levelId: string) {
  try {
    const raw = window.localStorage.getItem(HERO_JOURNEY_EDITOR_STORAGE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as { maps?: Record<string, unknown> };
    if (!parsed.maps) {
      return;
    }

    delete parsed.maps[levelId];
    window.localStorage.setItem(HERO_JOURNEY_EDITOR_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    window.localStorage.removeItem(HERO_JOURNEY_EDITOR_STORAGE_KEY);
  }
}

async function refreshLevels() {
  levels.value = await fetchAdminHeroJourneyLevels();
}

async function resetLevel() {
  const level = selectedLevel.value;
  if (!level) {
    return;
  }

  resettingLevel.value = true;
  try {
    const updated = await resetAdminHeroJourneyLevel(level.id);
    clearLocalLevelDraft(level.id);
    levels.value = levels.value.map((item) => (item.id === updated.id ? updated : item));
  } finally {
    resettingLevel.value = false;
  }
}

async function createLevel() {
  const nameKo = newLevel.nameKo.trim();
  const nameEn = (newLevel.nameEn.trim() || nameKo);
  if (!nameKo || creatingLevel.value) {
    return;
  }

  creatingLevel.value = true;
  try {
    const created = await createAdminHeroJourneyLevel({
      name: { ko: nameKo, en: nameEn },
      biome: newLevel.biome as HeroJourneyBiome,
    });
    levels.value = [...levels.value, created];
    selectedLevelId.value = created.id;
    newLevel.nameKo = '';
    newLevel.nameEn = '';
  } finally {
    creatingLevel.value = false;
  }
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(new Error('이미지를 읽을 수 없습니다.')));
    reader.readAsDataURL(file);
  });
}

async function selectAiImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  aiLevel.error = '';

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    aiLevel.error = '이미지 파일만 사용할 수 있습니다.';
    input.value = '';
    return;
  }

  if (file.size > 6 * 1024 * 1024) {
    aiLevel.error = '이미지는 6MB 이하로 줄여주세요.';
    input.value = '';
    return;
  }

  try {
    aiLevel.imageDataUrl = await readFileAsDataUrl(file);
    aiLevel.imageName = file.name;
  } catch (error) {
    aiLevel.error = error instanceof Error ? error.message : '이미지를 읽을 수 없습니다.';
  }
}

function clearAiImage() {
  aiLevel.imageDataUrl = '';
  aiLevel.imageName = '';
}

async function generateLevel() {
  if (!canGenerateAiLevel.value) {
    return;
  }

  generatingLevel.value = true;
  aiLevel.error = '';
  try {
    const created = await generateAdminHeroJourneyLevel({
      prompt: aiLevel.prompt.trim(),
      imageDataUrl: aiLevel.imageDataUrl || undefined,
    });
    levels.value = [...levels.value, created];
    selectedLevelId.value = created.id;
    aiLevel.prompt = '';
    clearAiImage();
  } catch (error) {
    aiLevel.error = error instanceof Error ? error.message : '레벨 생성에 실패했습니다.';
  } finally {
    generatingLevel.value = false;
  }
}

onMounted(async () => {
  await load();
  applySeo({
    title: game.value ? `${game.value.title} 관리` : '게임 관리',
    description: '게임별 운영 설정 관리 화면',
  });
});
</script>

<template>
  <section class="content-shell page-stack">
    <header class="page-hero compact">
      <RouterLink class="soft-chip" to="/admin">관리자 홈</RouterLink>
      <p class="eyebrow">Game Admin</p>
      <h1>{{ game?.title ?? '게임 관리' }}</h1>
      <p v-if="game">{{ game.slug }} · {{ game.version }} · {{ game.status }}</p>
    </header>

    <div v-if="loading" class="info-panel">
      <p>불러오는 중...</p>
    </div>

    <div v-else-if="game" class="admin-manage-layout">
      <aside class="info-panel admin-manage-menu">
        <button
          v-for="item in sectionItems"
          :key="item.id"
          class="admin-menu-button"
          :data-active="activeSection === item.id"
          type="button"
          @click="activeSection = item.id"
        >
          {{ item.label }}
        </button>
      </aside>

      <form class="info-panel admin-settings" @submit.prevent="saveSettings">
        <div class="section-heading tight">
          <div>
            <p class="eyebrow">{{ sectionItems.find((item) => item.id === activeSection)?.label }}</p>
            <h2>설정 편집</h2>
          </div>
          <button class="pill-button submit" :disabled="saving">{{ saving ? '저장 중...' : '변경 저장' }}</button>
        </div>

        <section v-if="activeSection === 'catalog'" class="admin-tab-panel">
          <label class="stacked-label">title <input v-model="form.title" required /></label>
          <label class="stacked-label">shortDescription <input v-model="form.shortDescription" required /></label>
          <label class="stacked-label">description <textarea v-model="form.description" rows="6" required /></label>
          <div class="admin-form-grid">
            <label class="stacked-label">
              status
              <select v-model="form.status">
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>
            <label class="stacked-label">categories <input v-model="form.categories" required /></label>
            <label class="stacked-label">tags <input v-model="form.tags" required /></label>
            <label class="stacked-label">relatedSlugs <input v-model="form.relatedSlugs" /></label>
          </div>
          <label class="checkbox-row">
            <input v-model="form.featured" type="checkbox" />
            추천 게임으로 표시
          </label>
        </section>

        <section v-if="activeSection === 'runtime'" class="admin-tab-panel">
          <div class="admin-form-grid">
            <label class="stacked-label">version <input v-model="form.version" required /></label>
            <label class="stacked-label">
              engineType
              <select v-model="form.engineType">
                <option value="canvas">canvas</option>
                <option value="webgl">webgl</option>
              </select>
            </label>
            <label class="stacked-label">
              orientation
              <select v-model="form.orientation">
                <option value="portrait">portrait</option>
                <option value="landscape">landscape</option>
                <option value="responsive">responsive</option>
              </select>
            </label>
            <label class="stacked-label">aspectRatio <input v-model="form.aspectRatio" required /></label>
            <label class="stacked-label">inputs <input v-model="form.inputs" required /></label>
            <label class="stacked-label">entryUrl <input v-model="form.entryUrl" required /></label>
          </div>
          <label class="stacked-label">thumbnailUrl <input v-model="form.thumbnailUrl" required /></label>
          <label class="stacked-label">bannerUrl <input v-model="form.bannerUrl" required /></label>
        </section>

        <section v-if="activeSection === 'validation'" class="admin-tab-panel">
          <div class="admin-form-grid">
            <label class="stacked-label">
              scoreOrder
              <select v-model="form.scoreOrder">
                <option value="higher_better">higher_better</option>
                <option value="lower_better">lower_better</option>
              </select>
            </label>
            <label class="stacked-label">modes <input v-model="form.modes" required /></label>
            <label class="stacked-label">minPlayTimeMs <input v-model.number="form.minPlayTimeMs" type="number" min="1000" /></label>
            <label class="stacked-label">maxScore <input v-model.number="form.maxScore" type="number" min="100" /></label>
          </div>
        </section>

        <section v-if="activeSection === 'levels'" class="admin-tab-panel">
          <template v-if="isHeroJourney">
            <div class="admin-form-grid">
              <label class="stacked-label">새 레벨명 <input v-model="newLevel.nameKo" placeholder="예: 얼어붙은 성문" /></label>
              <label class="stacked-label">영문명 <input v-model="newLevel.nameEn" placeholder="예: Frozen Gate" /></label>
              <label class="stacked-label">
                Biome
                <select v-model="newLevel.biome">
                  <option value="ruin">ruin</option>
                  <option value="forest">forest</option>
                  <option value="desert">desert</option>
                  <option value="mountain">mountain</option>
                </select>
              </label>
              <button class="pill-button submit" type="button" :disabled="creatingLevel || !newLevel.nameKo.trim()" @click="createLevel">
                {{ creatingLevel ? '추가 중...' : '레벨 추가' }}
              </button>
            </div>

            <div class="admin-level-generator">
              <div class="section-heading tight">
                <div>
                  <p class="eyebrow">AI Prompt</p>
                  <h3>AI 레벨 생성</h3>
                </div>
                <button class="pill-button submit" type="button" :disabled="!canGenerateAiLevel" @click="generateLevel">
                  {{ generatingLevel ? '생성 중...' : '자동 생성' }}
                </button>
              </div>
              <label class="stacked-label">
                프롬프트
                <textarea
                  v-model="aiLevel.prompt"
                  rows="4"
                  placeholder="예: 좀비가 배치된 숲길, 가운데 물길과 꽃밭, 양쪽 언덕"
                />
              </label>
              <div class="admin-ai-image-row">
                <label class="stacked-label">
                  이미지
                  <input accept="image/*" type="file" @change="selectAiImage" />
                </label>
                <div v-if="aiLevel.imageName" class="admin-ai-image-status">
                  <span class="soft-chip">{{ aiLevel.imageName }}</span>
                  <button class="pill-button quiet" type="button" @click="clearAiImage">이미지 제거</button>
                </div>
              </div>
              <p v-if="aiLevel.error" class="form-error">{{ aiLevel.error }}</p>
            </div>

            <div class="admin-toolbar">
              <select v-model="selectedLevelId">
                <option v-for="(level, index) in levels" :key="level.id" :value="level.id">
                  {{ index + 1 }}. {{ level.name.ko }}{{ level.custom ? ' · 추가됨' : '' }}{{ level.customized ? ' · 저장됨' : '' }}
                </option>
              </select>
              <a class="pill-button" :href="editorUrl" target="_blank" rel="noreferrer">저작 창 열기</a>
              <button class="pill-button quiet" type="button" @click="refreshLevels">저장 상태 새로고침</button>
              <button class="pill-button danger" type="button" :disabled="resettingLevel || !selectedLevel?.customized" @click="resetLevel">
                {{ resettingLevel ? '초기화 중...' : '서버 저장 초기화' }}
              </button>
            </div>

            <div v-if="selectedLevel" class="level-status-row">
              <span class="soft-chip">{{ selectedLevel.biome }}</span>
              <span v-if="selectedLevel.custom" class="soft-chip">추가 레벨</span>
              <span class="soft-chip">{{ selectedLevel.customized ? '서버 저장본 사용 중' : '기본 맵 데이터' }}</span>
              <span v-if="selectedLevel.updatedAt" class="soft-chip">{{ new Date(selectedLevel.updatedAt).toLocaleString() }}</span>
            </div>
          </template>
          <p v-else class="lead">이 게임에는 아직 전용 저작 도구가 연결되어 있지 않습니다.</p>
        </section>
      </form>
    </div>
  </section>
</template>

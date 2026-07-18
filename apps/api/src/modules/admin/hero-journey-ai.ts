import type {
  HeroJourneyBiome,
  HeroJourneyCoin,
  HeroJourneyEnemy,
  HeroJourneyEnemyKind,
  HeroJourneyFloorTile,
  HeroJourneyLevelCreateInput,
  HeroJourneyLevelGenerateInput,
  HeroJourneyMapConfig,
  HeroJourneyProp,
  HeroJourneyTerrainPaint,
  HeroJourneyTerrainPaintKind,
  HeroJourneyWallSegment,
} from '@casual-game-world/shared';

import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { HttpError } from '../../utils/http';

type LevelReferenceImage = {
  mimeType: string;
  data: string;
};

type HeroJourneyLevelPlan = {
  nameKo: string;
  nameEn: string;
  biome: HeroJourneyBiome;
  theme: string;
  layout: string;
  terrainMix: HeroJourneyTerrainPaintKind[];
  enemyFocus: HeroJourneyEnemyKind[];
  difficulty: number;
  landmarks: string[];
  pathStyle: 'stone' | 'dirt' | 'river' | 'mixed';
};

const BIOMES = ['forest', 'desert', 'mountain', 'ruin'] as const;
const TERRAIN_KINDS = ['desert', 'field', 'hill', 'water', 'grass', 'flowers', 'stone-path', 'dirt-path'] as const;
const ENEMY_KINDS = ['guard', 'scout', 'spearman', 'brute', 'warden', 'zombie', 'captain', 'giant', 'skeleton', 'demon'] as const;
const PATH_STYLES = ['stone', 'dirt', 'river', 'mixed'] as const;
const WATER_WORDS = ['water', 'river', 'stream', 'lake', 'pond', 'canal', '물', '강', '하천', '계곡', '호수', '연못', '물길'];
const FLOWER_WORDS = ['flower', 'garden', 'bloom', '꽃', '정원', '꽃밭'];
const ROAD_WORDS = ['road', 'path', 'trail', '길', '도로', '오솔길', '통로'];

const ENEMY_ARCHETYPES: Record<HeroJourneyEnemyKind, Omit<HeroJourneyEnemy, 'x' | 'z'>> = {
  guard: {
    kind: 'guard',
    hp: 3,
    speed: 1.28,
    value: 150,
    weapon: 'sword',
    damage: 14,
    attackIntervalMs: 1220,
    aggroRange: 4.7,
    attackRange: 1.16,
    radius: 0.38,
  },
  scout: {
    kind: 'scout',
    hp: 2,
    speed: 1.72,
    value: 140,
    weapon: 'sword',
    damage: 11,
    attackIntervalMs: 920,
    aggroRange: 5.8,
    attackRange: 1.1,
    radius: 0.34,
  },
  spearman: {
    kind: 'spearman',
    hp: 3,
    speed: 1.12,
    value: 170,
    weapon: 'spear',
    damage: 16,
    attackIntervalMs: 1380,
    aggroRange: 5.4,
    attackRange: 1.55,
    radius: 0.36,
  },
  brute: {
    kind: 'brute',
    hp: 5,
    speed: 0.92,
    value: 230,
    weapon: 'sword',
    shield: 'round',
    damage: 21,
    attackIntervalMs: 1520,
    aggroRange: 4.4,
    attackRange: 1.2,
    radius: 0.46,
  },
  warden: {
    kind: 'warden',
    hp: 8,
    speed: 0.9,
    value: 420,
    weapon: 'sword',
    shield: 'rectangle',
    damage: 28,
    attackIntervalMs: 1680,
    aggroRange: 5.3,
    attackRange: 1.28,
    radius: 0.52,
  },
  zombie: {
    kind: 'zombie',
    hp: 4,
    speed: 0.98,
    value: 180,
    weapon: 'sword',
    damage: 13,
    attackIntervalMs: 1450,
    aggroRange: 4.8,
    attackRange: 1.08,
    radius: 0.4,
    scale: 1.05,
  },
  captain: {
    kind: 'captain',
    hp: 8,
    speed: 1.32,
    value: 340,
    weapon: 'sword',
    damage: 24,
    attackIntervalMs: 1050,
    aggroRange: 5.8,
    attackRange: 1.28,
    radius: 0.48,
  },
  giant: {
    kind: 'giant',
    hp: 10,
    speed: 0.82,
    value: 380,
    weapon: 'sword',
    damage: 30,
    attackIntervalMs: 1800,
    aggroRange: 5.6,
    attackRange: 1.45,
    radius: 0.72,
  },
  skeleton: {
    kind: 'skeleton',
    hp: 3,
    speed: 1.22,
    value: 170,
    weapon: 'sword',
    damage: 14,
    attackIntervalMs: 1250,
    aggroRange: 5.2,
    attackRange: 1.12,
    radius: 0.34,
  },
  demon: {
    kind: 'demon',
    hp: 7,
    speed: 1.18,
    value: 280,
    weapon: 'sword',
    damage: 22,
    attackIntervalMs: 1180,
    aggroRange: 6,
    attackRange: 1.22,
    radius: 0.48,
  },
};

function includesAny(value: string, words: string[]) {
  const normalized = value.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seedSource: string) {
  let state = hashString(seedSource) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function pick<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length) % items.length]!;
}

function normalizeString(value: unknown, fallback: string, maxLength = 64) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
}

function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T) {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function pickEnumArray<T extends string>(value: unknown, allowed: readonly T[], fallback: readonly T[]) {
  const items = toStringArray(value).filter((item): item is T => (allowed as readonly string[]).includes(item));
  return items.length > 0 ? items : [...fallback];
}

function parseImageDataUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/^data:(image\/(?:png|jpe?g|webp));base64,([a-zA-Z0-9+/=\r\n]+)$/);
  if (!match) {
    throw new HttpError(400, 'Invalid image data URL');
  }

  const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1]!;
  const data = match[2]!.replace(/\s/g, '');
  if (data.length > 8_500_000) {
    throw new HttpError(413, 'Image is too large');
  }

  return { mimeType, data } satisfies LevelReferenceImage;
}

function inferBiome(prompt: string): HeroJourneyBiome {
  const lower = prompt.toLowerCase();
  if (lower.includes('forest') || lower.includes('woods') || prompt.includes('숲') || prompt.includes('나무')) {
    return 'forest';
  }
  if (lower.includes('desert') || lower.includes('sand') || lower.includes('canyon') || prompt.includes('사막') || prompt.includes('모래') || prompt.includes('협곡')) {
    return 'desert';
  }
  if (lower.includes('mountain') || lower.includes('snow') || lower.includes('cliff') || prompt.includes('산') || prompt.includes('고개') || prompt.includes('눈')) {
    return 'mountain';
  }
  return 'ruin';
}

function defaultTerrainMix(biome: HeroJourneyBiome, prompt: string) {
  const mix: HeroJourneyTerrainPaintKind[] =
    biome === 'desert'
      ? ['desert', 'hill', 'dirt-path']
      : biome === 'forest'
        ? ['field', 'grass', 'dirt-path']
        : biome === 'mountain'
          ? ['hill', 'grass', 'stone-path']
          : ['field', 'hill', 'stone-path'];

  if (includesAny(prompt, WATER_WORDS)) {
    mix.push('water');
  }
  if (includesAny(prompt, FLOWER_WORDS)) {
    mix.push('flowers');
  }
  if (includesAny(prompt, ROAD_WORDS) && !mix.includes('stone-path')) {
    mix.push('stone-path');
  }

  return [...new Set(mix)];
}

function defaultEnemyFocus(biome: HeroJourneyBiome, prompt: string): HeroJourneyEnemyKind[] {
  const lower = prompt.toLowerCase();
  const detected: HeroJourneyEnemyKind[] = [];

  if (lower.includes('zombie') || prompt.includes('좀비')) {
    detected.push('zombie');
  }
  if (lower.includes('skeleton') || prompt.includes('해골') || prompt.includes('스켈레톤')) {
    detected.push('skeleton');
  }
  if (lower.includes('demon') || prompt.includes('악마') || prompt.includes('데몬')) {
    detected.push('demon');
  }
  if (lower.includes('giant') || prompt.includes('거인')) {
    detected.push('giant');
  }
  if (lower.includes('captain') || lower.includes('pirate') || prompt.includes('대장') || prompt.includes('선장')) {
    detected.push('captain');
  }

  if (detected.length > 0) {
    return detected;
  }

  if (biome === 'forest') {
    return ['scout', 'guard', 'spearman'];
  }
  if (biome === 'desert') {
    return ['scout', 'zombie', 'spearman'];
  }
  if (biome === 'mountain') {
    return ['skeleton', 'brute', 'giant'];
  }
  return ['guard', 'skeleton', 'captain'];
}

function createFallbackPlan(prompt: string, hasImage: boolean): HeroJourneyLevelPlan {
  const source = prompt.trim();
  const biome = source ? inferBiome(source) : 'ruin';
  const nameSeed = source ? source.replace(/[{}[\]"'`]/g, '').trim().replace(/\s+/g, ' ').slice(0, 18) : 'AI 이미지';
  const hasWater = includesAny(source, WATER_WORDS);
  const hasFlowers = includesAny(source, FLOWER_WORDS);

  return {
    nameKo: `${nameSeed || 'AI'} 레벨`,
    nameEn: hasImage ? 'AI Image Draft' : 'AI Prompt Draft',
    biome,
    theme: source || 'Image based level draft',
    layout: hasWater ? 'river route' : biome === 'desert' ? 'wide canyon' : biome === 'forest' ? 'forest road' : 'ruined arena',
    terrainMix: defaultTerrainMix(biome, source),
    enemyFocus: defaultEnemyFocus(biome, source),
    difficulty: source.includes('어려') || source.toLowerCase().includes('hard') ? 4 : 3,
    landmarks: [
      biome,
      ...(hasWater ? ['water'] : []),
      ...(hasFlowers ? ['flowers'] : []),
      ...(hasImage ? ['image-reference'] : []),
    ],
    pathStyle: hasWater ? 'river' : biome === 'desert' || biome === 'forest' ? 'dirt' : 'stone',
  };
}

function sanitizePlan(value: unknown, fallback: HeroJourneyLevelPlan): HeroJourneyLevelPlan {
  const plan = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const biome = pickEnum(plan.biome, BIOMES, fallback.biome);
  const terrainMix = pickEnumArray(plan.terrainMix, TERRAIN_KINDS, fallback.terrainMix);
  const enemyFocus = pickEnumArray(plan.enemyFocus, ENEMY_KINDS, fallback.enemyFocus);
  const difficulty = clampNumber(Math.round(typeof plan.difficulty === 'number' ? plan.difficulty : fallback.difficulty), 1, 5);
  const pathStyle = pickEnum(plan.pathStyle, PATH_STYLES, fallback.pathStyle);

  return {
    nameKo: normalizeString(plan.nameKo, fallback.nameKo, 32),
    nameEn: normalizeString(plan.nameEn, fallback.nameEn, 48),
    biome,
    theme: normalizeString(plan.theme, fallback.theme, 120),
    layout: normalizeString(plan.layout, fallback.layout, 48),
    terrainMix: [...new Set(terrainMix)],
    enemyFocus: [...new Set(enemyFocus)],
    difficulty,
    landmarks: toStringArray(plan.landmarks).slice(0, 8),
    pathStyle,
  };
}

function extractJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
    }
    throw new Error('AI response did not contain JSON');
  }
}

function buildLevelPlanPrompt(prompt: string, hasImage: boolean) {
  return [
    'Create a Hero Journey level plan for a low-poly action RPG level editor.',
    'Return JSON only. Do not include markdown.',
    'The server will convert your plan into actual map tiles, terrain paints, props, enemies, and markers.',
    'Use this exact shape:',
    '{"nameKo":"Korean short name","nameEn":"English short name","biome":"forest|desert|mountain|ruin","theme":"short visual theme","layout":"wide arena, forest road, canyon, river route, etc","terrainMix":["desert","field","hill","water","grass","flowers","stone-path","dirt-path"],"enemyFocus":["guard","scout","spearman","brute","warden","zombie","captain","giant","skeleton","demon"],"difficulty":1,"landmarks":["trees","columns","water","flowers","rocks","traps"],"pathStyle":"stone|dirt|river|mixed"}',
    `Text prompt: ${prompt || '(image only)'}`,
    hasImage ? 'An image reference is attached. Infer the level mood, landmark density, terrain, and enemy mix from it.' : 'No image reference is attached.',
  ].join('\n');
}

function hasAzureOpenAiConfig() {
  return Boolean(env.azureOpenAiEndpoint && env.azureOpenAiApiKey && env.azureOpenAiDeployment);
}

function hasGeminiConfig() {
  return Boolean(env.geminiApiKey);
}

function normalizeAzureOpenAiBaseUrl(endpoint: string) {
  const trimmedEndpoint = endpoint.replace(/\/+$/, '');
  return trimmedEndpoint.endsWith('/openai/v1') ? trimmedEndpoint : `${trimmedEndpoint}/openai/v1`;
}

function getPlannerProviderOrder() {
  if (env.aiLevelProvider === 'azure-openai') {
    return ['azure-openai'] as const;
  }
  if (env.aiLevelProvider === 'gemini') {
    return ['gemini'] as const;
  }
  if (env.aiLevelProvider === 'local') {
    return [] as const;
  }

  return ['azure-openai', 'gemini'] as const;
}

function buildAzureOpenAiUserContent(prompt: string, image: LevelReferenceImage | null) {
  const content: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: buildLevelPlanPrompt(prompt, Boolean(image)),
    },
  ];

  if (image) {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${image.mimeType};base64,${image.data}`,
      },
    });
  }

  return content;
}

async function requestAzureOpenAiPlan(prompt: string, image: LevelReferenceImage | null) {
  const response = await fetch(`${normalizeAzureOpenAiBaseUrl(env.azureOpenAiEndpoint)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': env.azureOpenAiApiKey,
    },
    body: JSON.stringify({
      model: env.azureOpenAiDeployment,
      messages: [
        {
          role: 'system',
          content: 'You are a game level designer. You only return compact valid JSON that matches the requested schema.',
        },
        {
          role: 'user',
          content: buildAzureOpenAiUserContent(prompt, image),
        },
      ],
      temperature: 0.85,
      max_tokens: 1800,
      response_format: {
        type: 'json_object',
      },
    }),
  });

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | Array<{ type?: string; text?: string }> } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `Azure OpenAI request failed with ${response.status}`);
  }

  const content = json.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((part) => (part.type === 'text' || !part.type ? part.text : '')).filter(Boolean).join('\n')
    : content;
  if (!text) {
    throw new Error('Azure OpenAI response was empty');
  }

  return extractJsonObject(text);
}

async function requestGeminiPlan(prompt: string, image: LevelReferenceImage | null) {
  const parts: Array<Record<string, unknown>> = [{ text: buildLevelPlanPrompt(prompt, Boolean(image)) }];

  if (image) {
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  }

  const response = await fetch(`${env.geminiApiBaseUrl}/models/${encodeURIComponent(env.geminiModel)}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: 'You are a game level designer. You only return compact valid JSON that matches the requested schema.',
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.85,
        maxOutputTokens: 1800,
        responseMimeType: 'application/json',
      },
    }),
  });

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(json.error?.message ?? `Gemini request failed with ${response.status}`);
  }

  const text = json.candidates?.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text).filter(Boolean).join('\n');
  if (!text) {
    throw new Error('Gemini response was empty');
  }

  return extractJsonObject(text);
}

async function createLevelPlan(input: HeroJourneyLevelGenerateInput) {
  const prompt = input.prompt?.trim() ?? '';
  const image = parseImageDataUrl(input.imageDataUrl);
  const fallback = createFallbackPlan(prompt, Boolean(image));

  for (const provider of getPlannerProviderOrder()) {
    if (provider === 'azure-openai') {
      if (!hasAzureOpenAiConfig()) {
        continue;
      }

      try {
        return sanitizePlan(await requestAzureOpenAiPlan(prompt, image), fallback);
      } catch (error) {
        logger.warn('Azure OpenAI level generation fell back to the next planner', { error });
      }
    }

    if (provider === 'gemini') {
      if (!hasGeminiConfig()) {
        continue;
      }

      try {
        return sanitizePlan(await requestGeminiPlan(prompt, image), fallback);
      } catch (error) {
        logger.warn('Gemini level generation fell back to the next planner', { error });
      }
    }
  }

  return fallback;
}

function putTerrain(
  terrain: Map<string, Omit<HeroJourneyTerrainPaint, 'editorOrder'>>,
  kind: HeroJourneyTerrainPaintKind,
  x: number,
  z: number,
  level = 1,
) {
  const snappedX = Math.round(x * 2) / 2;
  const snappedZ = Math.round(z * 2) / 2;
  const maxLevel = kind === 'water' ? 4 : 8;
  const normalizedLevel = clampNumber(Math.round(level), 1, maxLevel);
  const key = `${kind}:${snappedX}:${snappedZ}`;
  const existing = terrain.get(key);
  terrain.set(key, {
    kind,
    x: snappedX,
    z: snappedZ,
    level: existing ? Math.max(existing.level, normalizedLevel) : normalizedLevel,
  });
}

function addTerrainLine(
  terrain: Map<string, Omit<HeroJourneyTerrainPaint, 'editorOrder'>>,
  kind: HeroJourneyTerrainPaintKind,
  points: Array<{ x: number; z: number }>,
  level = 1,
) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(end.x - start.x), Math.abs(end.z - start.z)) * 2));
    for (let step = 0; step <= steps; step += 1) {
      const progress = step / steps;
      putTerrain(terrain, kind, start.x + (end.x - start.x) * progress, start.z + (end.z - start.z) * progress, level);
    }
  }
}

function createWideFloor(random: () => number) {
  const floorTiles: Omit<HeroJourneyFloorTile, 'editorOrder'>[] = [];

  for (let x = -10; x <= 10; x += 1) {
    for (let z = -12; z <= 11; z += 1) {
      const cornerCut = (Math.abs(x) >= 9 && Math.abs(z) >= 10) || (x <= -9 && z <= -9) || (x >= 9 && z <= -10);
      const smallChip = (x === -10 && z >= 6 && z <= 8) || (x === 10 && z >= 7 && z <= 9);
      if (!cornerCut && !smallChip) {
        floorTiles.push({ x, z, detail: Math.abs(x * 3 - z * 2 + Math.floor(random() * 5)) % 7 === 0 });
      }
    }
  }

  return floorTiles;
}

function pushHorizontalWalls(
  walls: Array<Omit<HeroJourneyWallSegment, 'editorOrder'>>,
  z: number,
  fromX: number,
  toX: number,
  options: Partial<Pick<HeroJourneyWallSegment, 'half' | 'narrow' | 'opening'>> = {},
) {
  for (let x = fromX; x <= toX; x += 1) {
    walls.push({ x, z, rotationQuarter: 0, ...options });
  }
}

function pushVerticalWalls(
  walls: Array<Omit<HeroJourneyWallSegment, 'editorOrder'>>,
  x: number,
  fromZ: number,
  toZ: number,
  options: Partial<Pick<HeroJourneyWallSegment, 'half' | 'narrow' | 'opening'>> = {},
) {
  for (let z = fromZ; z <= toZ; z += 1) {
    walls.push({ x, z, rotationQuarter: 1, ...options });
  }
}

function createWalls(plan: HeroJourneyLevelPlan) {
  const walls: Array<Omit<HeroJourneyWallSegment, 'editorOrder'>> = [];

  for (let x = -10; x <= 10; x += 1) {
    if (x <= -2 || x >= 2) {
      walls.push({ x, z: -11.5, rotationQuarter: 0 });
    }
    walls.push({ x, z: 11.5, rotationQuarter: 0 });
  }

  for (let z = -11; z <= 11; z += 1) {
    walls.push({ x: -10.5, z, rotationQuarter: 1 });
    walls.push({ x: 10.5, z, rotationQuarter: 1 });
  }

  walls.push({ x: -1.5, z: -11.5, rotationQuarter: 0, half: true });
  walls.push({ x: 1.5, z: -11.5, rotationQuarter: 0, half: true });

  if (plan.biome === 'ruin' || plan.landmarks.some((item) => item.toLowerCase().includes('column'))) {
    pushHorizontalWalls(walls, 3.5, -8, -5, { half: true });
    pushHorizontalWalls(walls, 3.5, 5, 8, { half: true });
  }

  if (plan.layout.toLowerCase().includes('canyon') || plan.biome === 'mountain') {
    pushVerticalWalls(walls, -4.5, -8, -5, { narrow: true });
    pushVerticalWalls(walls, 4.5, -8, -5, { narrow: true });
    pushHorizontalWalls(walls, -1.5, -9, -6, { half: true });
    pushHorizontalWalls(walls, -1.5, 6, 9, { half: true });
  }

  return walls;
}

function addProp(props: Array<Omit<HeroJourneyProp, 'editorOrder'>>, key: string, x: number, z: number, radius: number, rotationQuarter = 0) {
  props.push({ key, x, z, radius, rotationQuarter });
}

function createProps(plan: HeroJourneyLevelPlan, random: () => number) {
  const props: Array<Omit<HeroJourneyProp, 'editorOrder'>> = [];

  if (plan.biome === 'forest') {
    [
      ['forest-tree-1', -9.1, -8.2, 0.72, 0],
      ['forest-tree-2', -6.8, -10.2, 0.72, 1],
      ['forest-tree-4', 8.7, -8.6, 0.72, 2],
      ['forest-tree-5', 8.6, 7.4, 0.72, 3],
      ['forest-plant-2', -8.4, 6.8, 0.42, 0],
      ['forest-plant-4', 6.8, 6.5, 0.36, 2],
      ['forest-grass-1', -2.8, 6.4, 0, 1],
      ['forest-grass-4', 2.6, -6.2, 0, 0],
      ['forest-rock-4', -7.4, -2.8, 0.42, 1],
      ['forest-rock-6', 7.3, -2.5, 0.62, 2],
    ].forEach(([key, x, z, radius, rotationQuarter]) => addProp(props, String(key), Number(x), Number(z), Number(radius), Number(rotationQuarter)));
  } else if (plan.biome === 'desert') {
    [
      ['terrain-1', -7.8, -8.2, 0, 0],
      ['terrain-2', 7.5, 7.4, 0, 2],
      ['rock-1', -8.1, 2.2, 0.58, 0],
      ['rock-3', 8.0, 1.8, 0.58, 1],
      ['plant-1', -8.7, 7.5, 0, 0],
      ['plant-4', 8.8, 6.9, 0, 0],
      ['plant-5', -3.8, -7.8, 0, 0],
      ['stones', -6.8, -6.4, 0.54, 1],
      ['stones', 6.8, -6.1, 0.54, 0],
      ['wood-support', -4.7, 7.2, 0.34, 1],
      ['wood-support', 4.7, 7.2, 0.34, 3],
    ].forEach(([key, x, z, radius, rotationQuarter]) => addProp(props, String(key), Number(x), Number(z), Number(radius), Number(rotationQuarter)));
  } else if (plan.biome === 'mountain') {
    [
      ['rock-1', -8.2, -7.4, 0.58, 0],
      ['rock-3', 8.2, -7.2, 0.58, 2],
      ['stones', -8.4, -3.4, 0.54, 0],
      ['stones', 8.4, -3.4, 0.54, 0],
      ['rocks', -7.8, 4.2, 0.58, 1],
      ['rocks', 7.8, 4.0, 0.58, 3],
      ['tree-3', -4.8, 7.2, 0.62, 1],
      ['bush-3', 4.8, 7.2, 0.42, 0],
    ].forEach(([key, x, z, radius, rotationQuarter]) => addProp(props, String(key), Number(x), Number(z), Number(radius), Number(rotationQuarter)));
  } else {
    [
      ['arena-column', -8.4, -5.8, 0.44, 0],
      ['arena-column-damaged', 8.2, -5.6, 0.4, 1],
      ['arena-column', -7.6, 5.0, 0.44, 0],
      ['arena-column-damaged', 7.4, 3.8, 0.4, 2],
      ['arena-border-straight', -8.5, -7.6, 0.28, 0],
      ['arena-border-straight', 8.4, 1.2, 0.28, 0],
      ['arena-statue', -1.2, 5.8, 0.48, 2],
      ['arena-weapon-rack', -4.2, 4.7, 0.42, 1],
      ['arena-trophy', 0, -1.4, 0.42, 0],
      ['arena-banner', 2.6, -5.0, 0.22, 0],
      ['arena-bricks', -9.0, -3.9, 0.34, 0],
      ['arena-block', 8.6, 5.4, 0.28, 1],
    ].forEach(([key, x, z, radius, rotationQuarter]) => addProp(props, String(key), Number(x), Number(z), Number(radius), Number(rotationQuarter)));
  }

  if (plan.terrainMix.includes('water')) {
    addProp(props, 'arena-stairs', -4.6, -0.8, 0, 1);
    addProp(props, 'arena-stairs', 4.6, 0.8, 0, 3);
  }

  if (plan.landmarks.some((item) => item.toLowerCase().includes('trap'))) {
    addProp(props, 'trap', -2.6, 2.8, 0.52, 0);
    addProp(props, 'trap', 2.7, 2.8, 0.52, 0);
  }

  const clutterPool = plan.biome === 'forest' ? ['forest-grass-2', 'forest-plant-3', 'forest-rock-2'] : plan.biome === 'desert' ? ['dirt', 'plant-5', 'stones'] : ['barrel', 'stones', 'rocks'];
  for (let index = 0; index < 6; index += 1) {
    const x = Math.round((random() * 16 - 8) * 10) / 10;
    const z = Math.round((random() * 15 - 6) * 10) / 10;
    if (Math.abs(x) < 2.2 && z > 6) {
      continue;
    }
    const key = pick(clutterPool, random);
    addProp(props, key, x, z, key === 'barrel' || key === 'stones' || key === 'rocks' ? 0.42 : 0, Math.floor(random() * 4));
  }

  return props;
}

function createEnemy(kind: HeroJourneyEnemyKind, x: number, z: number, rotationQuarter: number) {
  return {
    x,
    z,
    ...ENEMY_ARCHETYPES[kind],
    kind,
    rotationQuarter,
  } satisfies Omit<HeroJourneyEnemy, 'editorOrder'>;
}

function createEnemies(plan: HeroJourneyLevelPlan, random: () => number) {
  const count = 5 + plan.difficulty * 2;
  const positions = [
    { x: -8.2, z: 7.2 },
    { x: 8.2, z: 7.0 },
    { x: -7.4, z: -1.5 },
    { x: 7.4, z: -1.7 },
    { x: -4.4, z: -6.4 },
    { x: 4.5, z: -6.2 },
    { x: 0, z: -8.2 },
    { x: -2.7, z: 2.4 },
    { x: 2.8, z: 2.3 },
    { x: -6.2, z: 4.8 },
    { x: 6.2, z: 4.7 },
    { x: 0, z: -3.6 },
    { x: -8.2, z: -8.2 },
    { x: 8.0, z: -8.1 },
  ];

  return positions.slice(0, count).map((position, index) => {
    const kind = plan.difficulty >= 5 && index === count - 1 ? pick(['warden', 'giant', 'demon'] as const, random) : plan.enemyFocus[index % plan.enemyFocus.length]!;
    return createEnemy(kind, position.x, position.z, Math.floor(random() * 4));
  });
}

function createCoins(plan: HeroJourneyLevelPlan) {
  const value = 70 + plan.difficulty * 15;
  return [
    { x: -8.9, z: 8.8, value },
    { x: -6.2, z: -2.8, value },
    { x: -4.2, z: -8.6, value },
    { x: -1.2, z: 5.9, value },
    { x: 1.4, z: -9.4, value },
    { x: 4.8, z: 5.6, value },
    { x: 7.9, z: -2.5, value },
    { x: 8.4, z: 8.2, value },
    { x: 0, z: -0.2, value: value + 45 },
    { x: -2.8, z: -4.8, value },
    { x: 2.8, z: -4.8, value },
  ] satisfies Array<Omit<HeroJourneyCoin, 'editorOrder'>>;
}

function createTerrainPaints(plan: HeroJourneyLevelPlan, floorTiles: Array<Omit<HeroJourneyFloorTile, 'editorOrder'>>, random: () => number) {
  const terrain = new Map<string, Omit<HeroJourneyTerrainPaint, 'editorOrder'>>();
  const baseKind: HeroJourneyTerrainPaintKind = plan.biome === 'desert' ? 'desert' : plan.biome === 'mountain' ? 'hill' : plan.biome === 'forest' ? 'grass' : 'field';
  const secondaryKind: HeroJourneyTerrainPaintKind = plan.biome === 'desert' ? 'dirt-path' : plan.biome === 'forest' ? 'field' : 'grass';

  for (const tile of floorTiles) {
    const edgeBoost = Math.abs(tile.x) > 7 || Math.abs(tile.z) > 8 ? 2 : 1;
    const kind = random() > 0.78 ? secondaryKind : baseKind;
    putTerrain(terrain, kind, tile.x, tile.z, edgeBoost);
  }

  const roadKind: HeroJourneyTerrainPaintKind = plan.pathStyle === 'stone' ? 'stone-path' : 'dirt-path';
  addTerrainLine(
    terrain,
    roadKind,
    [
      { x: 0, z: 9.2 },
      { x: -3.4, z: 5.6 },
      { x: -1.3, z: 1.1 },
      { x: 3.1, z: -3.3 },
      { x: 0, z: -9.8 },
    ],
    1,
  );
  addTerrainLine(terrain, roadKind, [{ x: -7.8, z: 6.7 }, { x: 7.8, z: 6.7 }], 1);
  addTerrainLine(terrain, roadKind, [{ x: -7.2, z: -2.2 }, { x: 7.3, z: -2.2 }], 1);

  if (plan.terrainMix.includes('water') || plan.pathStyle === 'river') {
    addTerrainLine(
      terrain,
      'water',
      [
        { x: -9.2, z: 0.8 },
        { x: -5.5, z: -0.6 },
        { x: -1.8, z: 0.4 },
        { x: 2.8, z: -0.8 },
        { x: 8.8, z: 0.6 },
      ],
      2,
    );
  }

  if (plan.terrainMix.includes('flowers')) {
    for (const center of [
      { x: -5.7, z: 5.1 },
      { x: 5.8, z: 4.8 },
      { x: -3.4, z: -6.6 },
    ]) {
      for (let dx = -1; dx <= 1; dx += 0.5) {
        for (let dz = -1; dz <= 1; dz += 0.5) {
          if (Math.abs(dx) + Math.abs(dz) <= 1.6) {
            putTerrain(terrain, 'flowers', center.x + dx, center.z + dz, 1);
          }
        }
      }
    }
  }

  for (const center of [
    { x: -8.0, z: -7.8 },
    { x: 8.0, z: -7.6 },
    { x: -8.1, z: 4.2 },
    { x: 8.2, z: 4.0 },
  ]) {
    for (let dx = -1.5; dx <= 1.5; dx += 0.5) {
      for (let dz = -1.5; dz <= 1.5; dz += 0.5) {
        if (Math.abs(dx) + Math.abs(dz) <= 2.1) {
          putTerrain(terrain, 'hill', center.x + dx, center.z + dz, 2 + Math.floor(random() * 3));
        }
      }
    }
  }

  return [...terrain.values()];
}

function assignEditorOrders(map: Omit<HeroJourneyMapConfig, 'terrainPaints'> & { terrainPaints: Omit<HeroJourneyTerrainPaint, 'editorOrder'>[] }) {
  let editorOrder = 1;
  const stamp = <T extends object>(items: T[]) =>
    items.map((item) => ({
      ...item,
      editorOrder: editorOrder++,
    }));

  return {
    ...map,
    floorTiles: stamp(map.floorTiles),
    terrainPaints: stamp(map.terrainPaints),
    walls: stamp(map.walls),
    props: stamp(map.props),
    coins: stamp(map.coins),
    enemies: stamp(map.enemies),
  } satisfies HeroJourneyMapConfig;
}

function createMapFromPlan(plan: HeroJourneyLevelPlan) {
  const random = createRandom(`${plan.nameKo}:${plan.nameEn}:${plan.theme}:${plan.layout}`);
  const floorTiles = createWideFloor(random);
  const terrainPaints = createTerrainPaints(plan, floorTiles, random);
  const walls = createWalls(plan);
  const props = createProps(plan, random);
  const coins = createCoins(plan);
  const enemies = createEnemies(plan, random);

  return assignEditorOrders({
    floorTiles,
    terrainPaints,
    walls,
    props,
    coins,
    enemies,
    playerSpawn: { x: 0, z: 9.4 },
    chest: { x: 0, z: -1.4 },
    gate: { x: 0, z: -11.55 },
    exit: { x: 0, z: -12.35 },
  });
}

export async function generateHeroJourneyLevelInput(input: HeroJourneyLevelGenerateInput): Promise<HeroJourneyLevelCreateInput> {
  const prompt = input.prompt?.trim() ?? '';
  const plan = await createLevelPlan(input);
  const map = createMapFromPlan(plan);
  const themeKo = plan.theme || plan.nameKo;
  const themeEn = plan.theme || plan.nameEn;

  return {
    name: {
      ko: plan.nameKo,
      en: plan.nameEn,
    },
    biome: plan.biome,
    quest: {
      ko: `${themeKo} 구역의 적을 정리하고 중앙 보물상자를 여세요.`,
      en: `Clear the enemies across ${themeEn} and open the central chest.`,
    },
    intro: {
      ko: prompt ? `프롬프트 기반 자동 생성 레벨입니다. ${themeKo}` : `이미지 기반 자동 생성 레벨입니다. ${themeKo}`,
      en: prompt ? `AI-generated level from a prompt. ${themeEn}` : `AI-generated level from an image. ${themeEn}`,
    },
    clearText: {
      ko: `${plan.nameKo} 클리어. 다음 여정으로 이동합니다.`,
      en: `${plan.nameEn} cleared. Moving to the next journey.`,
    },
    map,
  };
}

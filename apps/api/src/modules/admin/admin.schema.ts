import { z } from 'zod';

export const adminGameSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  shortDescription: z.string().min(10),
  description: z.string().min(20),
  thumbnailUrl: z.string().url(),
  bannerUrl: z.string().url(),
  entryUrl: z.string().url(),
  version: z.string().min(3),
  engineType: z.enum(['canvas', 'webgl']),
  orientation: z.enum(['portrait', 'landscape', 'responsive']),
  aspectRatio: z.string().min(3),
  inputs: z.array(z.enum(['touch', 'keyboard', 'mouse'])).min(1),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  scoreOrder: z.enum(['higher_better', 'lower_better']),
  categories: z.array(z.string()).min(1),
  tags: z.array(z.string()).min(1),
  modes: z.array(z.enum(['normal', 'hard', 'time-attack'])).min(1),
  featured: z.boolean().default(false),
  validationRule: z.object({
    minPlayTimeMs: z.number().min(1000),
    maxScore: z.number().min(100),
    allowedModes: z.array(z.enum(['normal', 'hard', 'time-attack'])).min(1),
  }),
  relatedSlugs: z.array(z.string()).default([]),
});

export const adminGamePatchSchema = adminGameSchema.partial();

const heroJourneyGridPointSchema = z.object({
  x: z.number(),
  z: z.number(),
});

const heroJourneyLocalizedTextSchema = z.object({
  ko: z.string().min(1),
  en: z.string().min(1),
});

const heroJourneyEditorOrderSchema = {
  editorOrder: z.number().int().positive().optional(),
};

const heroJourneyTerrainPaintKindSchema = z.enum([
  'desert',
  'field',
  'hill',
  'water',
  'grass',
  'flowers',
  'stone-path',
  'dirt-path',
]);

const heroJourneyMapConfigSchema = z.object({
  floorTiles: z
    .array(
      heroJourneyGridPointSchema.extend({
        detail: z.boolean().optional(),
        ...heroJourneyEditorOrderSchema,
      }),
    )
    .min(1),
  terrainPaints: z
    .array(
      heroJourneyGridPointSchema.extend({
        kind: heroJourneyTerrainPaintKindSchema,
        level: z.number().int().min(1).max(8),
        ...heroJourneyEditorOrderSchema,
      }),
    )
    .default([]),
  walls: z.array(
    heroJourneyGridPointSchema.extend({
      rotationQuarter: z.number().int().min(0).max(3),
      half: z.boolean().optional(),
      narrow: z.boolean().optional(),
      opening: z.boolean().optional(),
      ...heroJourneyEditorOrderSchema,
    }),
  ),
  props: z.array(
    heroJourneyGridPointSchema.extend({
      key: z.string().min(1),
      radius: z.number().min(0),
      rotationQuarter: z.number().int().min(0).max(3).optional(),
      ...heroJourneyEditorOrderSchema,
    }),
  ),
  coins: z.array(
    heroJourneyGridPointSchema.extend({
      value: z.number().min(0),
      ...heroJourneyEditorOrderSchema,
    }),
  ),
  enemies: z.array(
    heroJourneyGridPointSchema.extend({
      hp: z.number().min(1),
      speed: z.number().min(0),
      value: z.number().min(0),
      kind: z
        .enum(['guard', 'scout', 'spearman', 'brute', 'warden', 'zombie', 'captain', 'giant', 'skeleton', 'demon'])
        .optional(),
      weapon: z.enum(['sword', 'spear']).optional(),
      shield: z.enum(['round', 'rectangle']).optional(),
      damage: z.number().min(0).optional(),
      radius: z.number().min(0).optional(),
      aggroRange: z.number().min(0).optional(),
      attackRange: z.number().min(0).optional(),
      attackIntervalMs: z.number().min(0).optional(),
      scale: z.number().min(0).optional(),
      rotationQuarter: z.number().int().min(0).max(3).optional(),
      ...heroJourneyEditorOrderSchema,
    }),
  ),
  playerSpawn: heroJourneyGridPointSchema,
  chest: heroJourneyGridPointSchema,
  gate: heroJourneyGridPointSchema,
  exit: heroJourneyGridPointSchema,
});

export const heroJourneyMapSchema = z.object({
  map: heroJourneyMapConfigSchema,
});

export const heroJourneyLevelCreateSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/)
    .optional(),
  name: heroJourneyLocalizedTextSchema,
  biome: z.enum(['forest', 'desert', 'mountain', 'ruin']).default('ruin'),
  quest: heroJourneyLocalizedTextSchema.optional(),
  intro: heroJourneyLocalizedTextSchema.optional(),
  clearText: heroJourneyLocalizedTextSchema.optional(),
  map: heroJourneyMapConfigSchema.optional(),
});

export const heroJourneyLevelGenerateSchema = z
  .object({
    prompt: z.string().max(4000).optional().default(''),
    imageDataUrl: z.string().max(9_000_000).optional(),
  })
  .refine((value) => value.prompt.trim().length > 0 || Boolean(value.imageDataUrl), {
    message: 'Prompt or image is required',
  });

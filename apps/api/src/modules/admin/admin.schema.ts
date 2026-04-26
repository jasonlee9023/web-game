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


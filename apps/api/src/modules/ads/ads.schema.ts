import { z } from 'zod';

export const adsConfigQuerySchema = z.object({
  page: z.enum(['home', 'game-list', 'game-detail', 'game-play', 'ranking', 'global-ranking']),
  gameSlug: z.string().optional(),
});

export const adsEventSchema = z.object({
  type: z.string().min(2),
  page: z.string().min(2),
  gameSlug: z.string().optional(),
  slotId: z.string().optional(),
});

import { z } from 'zod';

export const rankingQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'all']).default('daily'),
  mode: z.enum(['normal', 'hard', 'time-attack']).default('normal'),
});

export const globalRankingQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'all']).default('weekly'),
});


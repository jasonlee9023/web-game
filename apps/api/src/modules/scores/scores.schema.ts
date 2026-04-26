import { z } from 'zod';

export const createSessionSchema = z.object({
  mode: z.enum(['normal', 'hard', 'time-attack']).optional(),
});

export const submitScoreSchema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().min(0),
  playTimeMs: z.number().min(0),
  mode: z.enum(['normal', 'hard', 'time-attack']),
  metadata: z.record(z.unknown()).optional(),
  checksum: z.string().optional(),
});


import { z } from 'zod';

export const createMultiplayerRoomSchema = z.object({
  gameSlug: z.string().min(1),
  offer: z.string().min(1),
  title: z.string().trim().min(1).max(48).optional(),
});

export const joinMultiplayerRoomSchema = z.object({
  answer: z.string().min(1),
});


import type { Request, Response } from 'express';

import { ok } from '../../utils/http';
import { rankingsService } from './rankings.service';

function identityFromRequest(req: Request) {
  return {
    userId: req.authUser?.id,
    guestId: req.authUser ? undefined : req.query.guestId?.toString() ?? req.header('x-guest-id') ?? undefined,
  };
}

export const rankingsController = {
  game(req: Request, res: Response) {
    const period = (req.query.period?.toString() ?? 'daily') as 'daily' | 'weekly' | 'monthly' | 'all';
    const mode = (req.query.mode?.toString() ?? 'normal') as 'normal' | 'hard' | 'time-attack';
    res.json(ok(rankingsService.gameRanking(req.params.slug.toString(), { period, mode }, identityFromRequest(req))));
  },

  global(req: Request, res: Response) {
    res.json(ok(rankingsService.globalRanking((req.query.period?.toString() ?? 'weekly') as 'daily' | 'weekly' | 'monthly' | 'all')));
  },

  myScores(req: Request, res: Response) {
    res.json(ok(rankingsService.myScores(req.authUser!.id)));
  },
};

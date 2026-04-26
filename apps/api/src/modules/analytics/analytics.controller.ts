import type { Request, Response } from 'express';

import { ok } from '../../utils/http';
import { analyticsService } from './analytics.service';

function identity(req: Request) {
  return {
    userId: req.authUser?.id,
    guestId: req.authUser ? undefined : req.header('x-guest-id') ?? undefined,
  };
}

export const analyticsController = {
  track(req: Request, res: Response) {
    res.status(201).json(ok(analyticsService.track(req.params.eventType.toString(), req.body, identity(req))));
  },
};

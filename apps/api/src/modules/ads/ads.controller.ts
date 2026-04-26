import type { Request, Response } from 'express';

import { ok } from '../../utils/http';
import { adsConfigQuerySchema } from './ads.schema';
import { adsService } from './ads.service';

export const adsController = {
  config(req: Request, res: Response) {
    const query = adsConfigQuerySchema.parse(req.query);
    res.json(ok(adsService.getConfig(query.page, query.gameSlug)));
  },

  event(req: Request, res: Response) {
    res.status(201).json(
      ok(
        adsService.trackEvent({
          ...req.body,
          userId: req.authUser?.id,
          guestId: req.authUser ? undefined : req.header('x-guest-id') ?? undefined,
        }),
      ),
    );
  },
};

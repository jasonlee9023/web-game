import type { Request, Response } from 'express';
import { createHash } from 'node:crypto';

import { ok } from '../../utils/http';
import { scoresService } from './scores.service';

function identityFromRequest(req: Request) {
  return {
    userId: req.authUser?.id,
    guestId: req.authUser ? undefined : req.query.guestId?.toString() ?? req.header('x-guest-id') ?? undefined,
  };
}

function hash(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export const scoresController = {
  createSession(req: Request, res: Response) {
    const session = scoresService.createSession(req.params.slug.toString(), identityFromRequest(req), {
      ipHash: hash(req.ip ?? 'unknown-ip'),
      userAgentHash: hash(req.header('user-agent') ?? 'unknown-ua'),
    });

    res.status(201).json(
      ok({
        sessionId: session.sessionId,
        seed: session.seed,
        startedAt: session.startedAt,
      }),
    );
  },

  submit(req: Request, res: Response) {
    res.status(201).json(ok(scoresService.submit(req.params.slug.toString(), req.body, identityFromRequest(req))));
  },

  myBest(req: Request, res: Response) {
    res.json(ok(scoresService.myBest(req.params.slug.toString(), identityFromRequest(req))));
  },
};

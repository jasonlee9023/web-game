import type { Request, Response } from 'express';

import { HttpError, ok } from '../../utils/http';
import { multiplayerService } from './multiplayer.service';

function identityFromRequest(req: Request) {
  const peerId =
    req.header('x-multiplayer-peer-id') ??
    req.header('x-guest-id') ??
    req.authUser?.id ??
    undefined;

  return {
    userId: undefined,
    guestId: peerId,
    displayName: req.authUser?.displayName ?? (peerId ? `Guest ${peerId.slice(-4).toUpperCase()}` : 'Guest'),
  };
}

export const multiplayerController = {
  list(req: Request, res: Response) {
    const gameSlug = req.query.gameSlug?.toString();

    if (!gameSlug) {
      throw new HttpError(400, 'gameSlug is required');
    }

    res.json(ok(multiplayerService.listRooms(gameSlug, identityFromRequest(req))));
  },

  create(req: Request, res: Response) {
    res.status(201).json(ok(multiplayerService.createRoom(req.body, identityFromRequest(req))));
  },

  detail(req: Request, res: Response) {
    res.json(ok(multiplayerService.getRoom(req.params.roomId.toString(), identityFromRequest(req))));
  },

  join(req: Request, res: Response) {
    res.status(201).json(ok(multiplayerService.joinRoom(req.params.roomId.toString(), req.body, identityFromRequest(req))));
  },

  heartbeat(req: Request, res: Response) {
    res.json(ok(multiplayerService.heartbeat(req.params.roomId.toString(), identityFromRequest(req))));
  },

  close(req: Request, res: Response) {
    res.json(ok({ success: multiplayerService.closeRoom(req.params.roomId.toString(), identityFromRequest(req)) }));
  },
};

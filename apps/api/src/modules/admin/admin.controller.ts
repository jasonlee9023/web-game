import type { Request, Response } from 'express';

import { ok } from '../../utils/http';
import { adminService } from './admin.service';

export const adminController = {
  dashboard(_req: Request, res: Response) {
    res.json(ok(adminService.dashboard()));
  },

  games(_req: Request, res: Response) {
    res.json(ok(adminService.listGames()));
  },

  createGame(req: Request, res: Response) {
    res.status(201).json(ok(adminService.createGame(req.body)));
  },

  updateGame(req: Request, res: Response) {
    res.json(ok(adminService.updateGame(req.params.id.toString(), req.body)));
  },

  publishGame(req: Request, res: Response) {
    res.json(ok(adminService.publishGame(req.params.id.toString())));
  },
};

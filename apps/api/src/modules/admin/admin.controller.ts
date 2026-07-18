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

  heroJourneyLevels(_req: Request, res: Response) {
    res.json(ok(adminService.listHeroJourneyLevels()));
  },

  createHeroJourneyLevel(req: Request, res: Response) {
    res.status(201).json(ok(adminService.createHeroJourneyLevel(req.body)));
  },

  async generateHeroJourneyLevel(req: Request, res: Response) {
    res.status(201).json(ok(await adminService.generateHeroJourneyLevel(req.body)));
  },

  saveHeroJourneyLevel(req: Request, res: Response) {
    res.json(ok(adminService.saveHeroJourneyLevel(req.params.levelId.toString(), req.body.map)));
  },

  resetHeroJourneyLevel(req: Request, res: Response) {
    res.json(ok(adminService.resetHeroJourneyLevel(req.params.levelId.toString())));
  },
};

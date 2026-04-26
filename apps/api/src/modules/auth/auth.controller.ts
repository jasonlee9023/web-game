import type { Request, Response } from 'express';

import { ok } from '../../utils/http';
import { authService } from './auth.service';

export const authController = {
  signup(req: Request, res: Response) {
    res.status(201).json(ok(authService.signup(req.body, res)));
  },

  login(req: Request, res: Response) {
    res.json(ok(authService.login(req.body, res)));
  },

  logout(req: Request, res: Response) {
    res.json(ok(authService.logout(req.cookies.cgw_refresh_token, res)));
  },

  refresh(req: Request, res: Response) {
    res.json(ok(authService.refresh(req.cookies.cgw_refresh_token, res)));
  },

  me(req: Request, res: Response) {
    res.json(ok(req.authUser ?? null));
  },

  updateProfile(req: Request, res: Response) {
    res.json(ok(authService.updateProfile(req.authUser!.id, req.body.displayName)));
  },
};


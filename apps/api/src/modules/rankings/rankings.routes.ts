import { Router } from 'express';

import { authRequiredMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { rankingsController } from './rankings.controller';

export const rankingsRouter = Router();

rankingsRouter.get('/games/:slug/rankings', optionalAuthMiddleware, rankingsController.game);
rankingsRouter.get('/rankings/global', optionalAuthMiddleware, rankingsController.global);
rankingsRouter.get('/users/me/scores', authRequiredMiddleware, rankingsController.myScores);


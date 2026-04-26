import { Router } from 'express';

import { optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { rateLimitMiddleware } from '../../middlewares/rate-limit.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { scoresController } from './scores.controller';
import { createSessionSchema, submitScoreSchema } from './scores.schema';

export const scoresRouter = Router();

scoresRouter.post('/:slug/sessions', optionalAuthMiddleware, rateLimitMiddleware(20, 60_000), validateBody(createSessionSchema), scoresController.createSession);
scoresRouter.post('/:slug/scores', optionalAuthMiddleware, rateLimitMiddleware(30, 60_000), validateBody(submitScoreSchema), scoresController.submit);
scoresRouter.get('/:slug/my-best-score', optionalAuthMiddleware, scoresController.myBest);


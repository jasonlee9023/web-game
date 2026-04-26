import { Router } from 'express';

import { optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { analyticsController } from './analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.post('/:eventType', optionalAuthMiddleware, analyticsController.track);


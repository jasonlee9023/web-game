import { Router } from 'express';

import { optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { adsController } from './ads.controller';
import { adsEventSchema } from './ads.schema';

export const adsRouter = Router();

adsRouter.get('/config', adsController.config);
adsRouter.post('/events', optionalAuthMiddleware, validateBody(adsEventSchema), adsController.event);

import { Router } from 'express';

import { adminRequiredMiddleware } from '../../middlewares/admin.middleware';
import { authRequiredMiddleware } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { adminController } from './admin.controller';
import {
  adminGamePatchSchema,
  adminGameSchema,
  heroJourneyLevelCreateSchema,
  heroJourneyLevelGenerateSchema,
  heroJourneyMapSchema,
} from './admin.schema';

export const adminRouter = Router();

adminRouter.use(authRequiredMiddleware, adminRequiredMiddleware);
adminRouter.get('/dashboard', adminController.dashboard);
adminRouter.get('/games', adminController.games);
adminRouter.get('/games/hero-journey/levels', adminController.heroJourneyLevels);
adminRouter.post(
  '/games/hero-journey/levels/generate',
  validateBody(heroJourneyLevelGenerateSchema),
  adminController.generateHeroJourneyLevel,
);
adminRouter.post('/games/hero-journey/levels', validateBody(heroJourneyLevelCreateSchema), adminController.createHeroJourneyLevel);
adminRouter.patch('/games/hero-journey/levels/:levelId', validateBody(heroJourneyMapSchema), adminController.saveHeroJourneyLevel);
adminRouter.delete('/games/hero-journey/levels/:levelId', adminController.resetHeroJourneyLevel);
adminRouter.post('/games', validateBody(adminGameSchema), adminController.createGame);
adminRouter.patch('/games/:id', validateBody(adminGamePatchSchema), adminController.updateGame);
adminRouter.post('/games/:id/publish', adminController.publishGame);

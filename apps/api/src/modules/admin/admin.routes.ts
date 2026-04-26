import { Router } from 'express';

import { adminRequiredMiddleware } from '../../middlewares/admin.middleware';
import { authRequiredMiddleware } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { adminController } from './admin.controller';
import { adminGamePatchSchema, adminGameSchema } from './admin.schema';

export const adminRouter = Router();

adminRouter.use(authRequiredMiddleware, adminRequiredMiddleware);
adminRouter.get('/dashboard', adminController.dashboard);
adminRouter.get('/games', adminController.games);
adminRouter.post('/games', validateBody(adminGameSchema), adminController.createGame);
adminRouter.patch('/games/:id', validateBody(adminGamePatchSchema), adminController.updateGame);
adminRouter.post('/games/:id/publish', adminController.publishGame);


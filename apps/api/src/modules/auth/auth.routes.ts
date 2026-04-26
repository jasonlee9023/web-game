import { Router } from 'express';

import { authRequiredMiddleware, optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { authController } from './auth.controller';
import { loginSchema, signupSchema, updateProfileSchema } from './auth.schema';

export const authRouter = Router();

authRouter.post('/signup', validateBody(signupSchema), authController.signup);
authRouter.post('/login', validateBody(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/refresh', authController.refresh);
authRouter.get('/me', optionalAuthMiddleware, authController.me);
authRouter.patch('/me', authRequiredMiddleware, validateBody(updateProfileSchema), authController.updateProfile);


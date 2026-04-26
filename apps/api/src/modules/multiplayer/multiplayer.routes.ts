import { Router } from 'express';

import { optionalAuthMiddleware } from '../../middlewares/auth.middleware';
import { rateLimitMiddleware } from '../../middlewares/rate-limit.middleware';
import { validateBody } from '../../middlewares/validate.middleware';
import { multiplayerController } from './multiplayer.controller';
import { createMultiplayerRoomSchema, joinMultiplayerRoomSchema } from './multiplayer.schema';

export const multiplayerRouter = Router();

multiplayerRouter.get('/rooms', optionalAuthMiddleware, rateLimitMiddleware(60, 60_000), multiplayerController.list);
multiplayerRouter.post('/rooms', optionalAuthMiddleware, rateLimitMiddleware(20, 60_000), validateBody(createMultiplayerRoomSchema), multiplayerController.create);
multiplayerRouter.get('/rooms/:roomId', optionalAuthMiddleware, rateLimitMiddleware(60, 60_000), multiplayerController.detail);
multiplayerRouter.post('/rooms/:roomId/join', optionalAuthMiddleware, rateLimitMiddleware(20, 60_000), validateBody(joinMultiplayerRoomSchema), multiplayerController.join);
multiplayerRouter.post('/rooms/:roomId/heartbeat', optionalAuthMiddleware, rateLimitMiddleware(120, 60_000), multiplayerController.heartbeat);
multiplayerRouter.delete('/rooms/:roomId', optionalAuthMiddleware, rateLimitMiddleware(30, 60_000), multiplayerController.close);

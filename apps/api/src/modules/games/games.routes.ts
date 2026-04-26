import { Router } from 'express';

import { gamesController } from './games.controller';

export const gamesRouter = Router();

gamesRouter.get('/', gamesController.list);
gamesRouter.get('/:slug', gamesController.detail);
gamesRouter.get('/:slug/related', gamesController.related);


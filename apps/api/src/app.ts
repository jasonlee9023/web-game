import fs from 'node:fs';
import path from 'node:path';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { errorMiddleware } from './middlewares/error.middleware';
import { requestIdMiddleware } from './middlewares/request-id.middleware';
import { adminRouter } from './modules/admin/admin.routes';
import { adsRouter } from './modules/ads/ads.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { authRouter } from './modules/auth/auth.routes';
import { gamesRouter } from './modules/games/games.routes';
import { multiplayerRouter } from './modules/multiplayer/multiplayer.routes';
import { rankingsRouter } from './modules/rankings/rankings.routes';
import { scoresRouter } from './modules/scores/scores.routes';
import { ok, resolveShareableWebOrigin, resolveWebOrigin } from './utils/http';

export function createApp() {
  const app = express();
  const webDistPath = path.resolve(process.cwd(), env.webDistDir);
  app.set('trust proxy', true);

  app.use(
    cors({
      origin: env.webOrigin,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);

  app.get('/health', (_req, res) => {
    res.json(ok({ status: 'ok', service: 'casual-game-world-api' }));
  });

  app.get('/api/config', (req, res) => {
    res.json(
      ok({
        webOrigin: resolveWebOrigin(req),
        shareOrigin: resolveShareableWebOrigin(req),
      }),
    );
  });

  app.get('/ads.txt', (_req, res) => {
    res.type('text/plain');
    res.send(env.adsensePublisherId ? `google.com, ${env.adsensePublisherId}, DIRECT, f08c47fec0942fa0\n` : '');
  });

  app.use('/api/auth', authRouter);
  app.use('/api/games', gamesRouter);
  app.use('/api/games', scoresRouter);
  app.use('/api/multiplayer', multiplayerRouter);
  app.use('/api', rankingsRouter);
  app.use('/api/ads', adsRouter);
  app.use('/api/events', analyticsRouter);
  app.use('/api/admin', adminRouter);

  if (env.serveWeb && fs.existsSync(webDistPath)) {
    app.use(express.static(webDistPath, { index: false }));
    app.get(/^(?!\/api(?:\/|$)|\/health$).*/, (req, res, next) => {
      if (!req.accepts('html')) {
        next();
        return;
      }

      res.sendFile(path.join(webDistPath, 'index.html'), (error) => {
        if (error) {
          next(error);
        }
      });
    });
  }

  app.use(errorMiddleware);

  return app;
}

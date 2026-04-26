import type { RequestHandler } from 'express';

import { HttpError } from '../utils/http';

const bucket = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(limit: number, windowMs: number): RequestHandler {
  return (req, _res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = bucket.get(key);

    if (!current || current.resetAt < now) {
      bucket.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= limit) {
      next(new HttpError(429, 'Too many requests'));
      return;
    }

    current.count += 1;
    next();
  };
}


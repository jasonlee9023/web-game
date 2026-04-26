import type { RequestHandler } from 'express';

import { HttpError } from '../utils/http';
import { verifyAccessToken } from '../utils/tokens';

export const optionalAuthMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.header('authorization');

  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = header.replace('Bearer ', '');
    const payload = verifyAccessToken(token);
    req.authUser = {
      id: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      role: payload.role,
    };
  } catch {
    req.authUser = undefined;
  }

  next();
};

export const authRequiredMiddleware: RequestHandler = (req, _res, next) => {
  optionalAuthMiddleware(req, _res, () => {
    if (!req.authUser) {
      next(new HttpError(401, 'Authentication required'));
      return;
    }
    next();
  });
};

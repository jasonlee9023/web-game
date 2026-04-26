import type { RequestHandler } from 'express';

import { HttpError } from '../utils/http';

export const adminRequiredMiddleware: RequestHandler = (req, _res, next) => {
  if (!req.authUser) {
    next(new HttpError(401, 'Authentication required'));
    return;
  }

  if (req.authUser.role !== 'admin') {
    next(new HttpError(403, 'Admin access required'));
    return;
  }

  next();
};


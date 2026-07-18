import type { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger';
import { HttpError } from '../utils/http';

export function errorMiddleware(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details,
    });
    return;
  }

  if (error instanceof Error) {
    logger.error('Unhandled request error', {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      error,
    });
    res.status(500).json({ error: error.message });
    return;
  }

  logger.error('Unhandled request error', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    error,
  });
  res.status(500).json({ error: 'Unknown server error' });
}

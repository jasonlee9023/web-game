import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };
}

export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.parse(req.query) as Record<string, unknown>;
    Object.assign(req.query as Record<string, unknown>, parsed);
    next();
  };
}

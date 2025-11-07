import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../utils/httpError';

type ValidationParts = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, part: ValidationParts = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(badRequest('Validation failed', result.error.flatten()));
      return;
    }

    req[part] = result.data;
    next();
  };

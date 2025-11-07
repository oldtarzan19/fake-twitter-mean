import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const status = err instanceof HttpError ? err.status : 500;
  const payload: { error: { message: string; details?: unknown } } = {
    error: {
      message: err.message || 'Internal Server Error',
    },
  };

  if (err instanceof HttpError && typeof err.details !== 'undefined') {
    payload.error.details = err.details;
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json(payload);
};

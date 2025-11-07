import { NextFunction, Request, Response } from 'express';

export const asyncHandler =
  <T extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>>(fn: T) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };

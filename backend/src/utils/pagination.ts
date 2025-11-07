import { Request } from 'express';

export interface PaginationParams {
  limit: number;
  skip: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export const getPagination = (req: Request): PaginationParams => {
  const limitRaw = req.query.limit as string | undefined;
  const skipRaw = req.query.skip as string | undefined;

  const limitParsed = limitRaw ? Number.parseInt(limitRaw, 10) : DEFAULT_LIMIT;
  const skipParsed = skipRaw ? Number.parseInt(skipRaw, 10) : 0;

  const limit = Number.isNaN(limitParsed)
    ? DEFAULT_LIMIT
    : Math.max(1, Math.min(MAX_LIMIT, limitParsed));
  const skip = Number.isNaN(skipParsed) ? 0 : Math.max(0, skipParsed);

  return { limit, skip };
};

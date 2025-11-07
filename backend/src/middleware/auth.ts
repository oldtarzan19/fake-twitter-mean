import { NextFunction, Request, Response } from 'express';
import { forbidden, unauthorized } from '../utils/httpError';
import { UserModel } from '../models/User';

const loadCurrentUser = async (req: Request) => {
  if (req.currentUser !== undefined) {
    return req.currentUser;
  }

  if (!req.session.userId) {
    req.currentUser = null;
    return null;
  }

  const user = await UserModel.findById(req.session.userId);
  if (!user) {
    delete req.session.userId;
    req.currentUser = null;
    return null;
  }

  req.currentUser = user;
  return user;
};

export const attachOptionalUser = async (req: Request, _res: Response, next: NextFunction) => {
  await loadCurrentUser(req);
  next();
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const user = await loadCurrentUser(req);
  if (!user) {
    next(unauthorized('Authentication required'));
    return;
  }

  next();
};

export const requireActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const user = await loadCurrentUser(req);
  if (!user) {
    next(unauthorized('Authentication required'));
    return;
  }

  if (user.isSuspended) {
    next(forbidden('Account suspended'));
    return;
  }

  next();
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = await loadCurrentUser(req);
  if (!user) {
    next(unauthorized('Authentication required'));
    return;
  }

  if (user.role !== 'admin') {
    next(forbidden('Admin privileges required'));
    return;
  }

  next();
};

export const getCurrentUserUnsafe = async (req: Request) => loadCurrentUser(req);

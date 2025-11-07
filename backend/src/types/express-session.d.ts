import { IUserDocument } from '../models/User';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    role?: 'user' | 'admin';
  }
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: IUserDocument | null;
    }
  }
}

export {};

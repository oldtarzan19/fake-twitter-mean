import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword, verifyPassword } from '../utils/password';
import { badRequest, unauthorized } from '../utils/httpError';
import { getCurrentUserUnsafe } from '../middleware/auth';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, bio } = req.body;
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await UserModel.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existingUser) {
    throw badRequest('Username or email already in use');
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    role: 'user',
    bio,
  });

  req.session.userId = user.id;
  req.session.role = user.role;

  res.status(201).json({ user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    throw unauthorized('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw unauthorized('Invalid credentials');
  }

  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ user });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }
      res.clearCookie('fake_twitter.sid');
      resolve();
    });
  });

  res.json({ success: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await getCurrentUserUnsafe(req);
  if (!user) {
    throw unauthorized('Authentication required');
  }

  res.json({ user });
});

import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { login, logout, me, register } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(6).max(64),
  bio: z.string().max(280).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(64),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;

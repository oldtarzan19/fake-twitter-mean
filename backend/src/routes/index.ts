import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import tweetRoutes from './tweetRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tweets', tweetRoutes);
router.use('/admin', adminRoutes);

export default router;

import { Router } from 'express';
import { requireActiveUser, requireAuth } from '../middleware/auth';
import {
  followUser,
  getFollowers,
  getFollowing,
  getUserById,
  unfollowUser,
} from '../controllers/userController';

const router = Router();

router.get('/:userId/followers', requireAuth, getFollowers);
router.get('/:userId/following', requireAuth, getFollowing);
router.post('/:userId/follow', requireActiveUser, followUser);
router.delete('/:userId/follow', requireActiveUser, unfollowUser);
router.get('/:userId', requireAuth, getUserById);

export default router;

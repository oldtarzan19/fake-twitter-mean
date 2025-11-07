import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/auth';
import {
  deleteUser,
  listUsers,
  updateUserSuspension,
} from '../controllers/adminController';
import { validate } from '../middleware/validate';

const router = Router();

const suspensionSchema = z.object({
  isSuspended: z.boolean(),
});

router.use(requireAdmin);
router.get('/users', listUsers);
router.patch('/users/:userId/suspension', validate(suspensionSchema), updateUserSuspension);
router.delete('/users/:userId', deleteUser);

export default router;

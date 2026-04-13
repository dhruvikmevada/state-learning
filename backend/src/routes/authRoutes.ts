import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);
router.post('/logout', authenticate, authController.logout);
router.get('/users', authenticate, requirePermission('MANAGE_USERS'), authController.listUsers);

export default router;

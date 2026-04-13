import { Router } from 'express';
import * as configController from '../controllers/configController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.get('/thresholds', authenticate, configController.getThresholds);
router.patch('/thresholds', authenticate, requirePermission('MANAGE_CONFIG'), configController.updateThresholds);

export default router;

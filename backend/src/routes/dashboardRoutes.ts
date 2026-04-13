import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.get('/kpis', authenticate, requirePermission('VIEW_DASHBOARD'), dashboardController.getKPIs);
router.get('/breakdowns', authenticate, requirePermission('VIEW_DASHBOARD'), dashboardController.getBreakdowns);
router.get('/watchouts', authenticate, requirePermission('VIEW_DASHBOARD'), dashboardController.getWatchouts);
router.get('/top-drivers', authenticate, requirePermission('VIEW_DASHBOARD'), dashboardController.getTopDrivers);

export default router;

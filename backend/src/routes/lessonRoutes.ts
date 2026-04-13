import { Router } from 'express';
import * as lessonController from '../controllers/lessonController';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

router.get('/filters', authenticate, lessonController.filters);
router.get('/', authenticate, requirePermission('VIEW_REGISTER'), lessonController.list);
router.get('/:id', authenticate, requirePermission('VIEW_REGISTER'), lessonController.getById);
router.post('/', authenticate, requirePermission('SUBMIT_LESSON'), lessonController.create);
router.patch('/:id', authenticate, requirePermission('SUBMIT_LESSON'), lessonController.update);
router.get('/:id/audit', authenticate, requirePermission('VIEW_REGISTER'), lessonController.getAudit);

// Approval routes
router.post('/:id/approve/pm', authenticate, requirePermission('APPROVE_PM'), lessonController.approvePM);
router.post('/:id/approve/pmo', authenticate, requirePermission('APPROVE_PMO'), lessonController.approvePMO);
router.post('/:id/approve/department', authenticate, requirePermission('APPROVE_DEPARTMENT'), lessonController.approveDepartment);

export default router;

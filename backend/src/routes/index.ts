import { Router } from 'express';
import authRoutes from './authRoutes';
import lessonRoutes from './lessonRoutes';
import dashboardRoutes from './dashboardRoutes';
import configRoutes from './configRoutes';
import azureAdRoutes from '../auth/azureAd';
import { config } from '../config';

const router = Router();

router.use('/auth', authRoutes);
if (config.auth.mode === 'azure') {
  router.use('/auth', azureAdRoutes);
}
router.use('/api/lessons', lessonRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/config', configRoutes);

export default router;

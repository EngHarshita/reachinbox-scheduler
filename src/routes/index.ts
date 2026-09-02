import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import emailRoutes from './email.routes';
import slackRoutes from './slack.routes';
import { getEmailHealthStatus, getEmailDebugStatus } from '../controllers/system.controller';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/slack', slackRoutes);
router.get('/system/email-health', getEmailHealthStatus);
router.get('/system/email-debug', getEmailDebugStatus);

export default router;

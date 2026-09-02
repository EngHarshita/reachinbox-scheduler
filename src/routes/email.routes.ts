import { Router } from 'express';
import { handleScheduleEmail, handleGetScheduledEmails, handleGetSentEmails, handleSearchEmails, handleGetEmailStats } from '../controllers/email.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { scheduleEmailSchema } from '../schemas/email.schema';

const router = Router();

router.post('/schedule', authenticateJwt, validateRequest(scheduleEmailSchema), handleScheduleEmail);
router.get('/scheduled', authenticateJwt, handleGetScheduledEmails);
router.get('/sent', authenticateJwt, handleGetSentEmails);
router.get('/search', authenticateJwt, handleSearchEmails);
router.get('/stats', authenticateJwt, handleGetEmailStats);

export default router;

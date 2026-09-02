import { Router } from 'express';
import { handleGetSlackAuthUrl, handleSlackCallback, handleGetSlackStatus, handleDisconnectSlack } from '../controllers/slack.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.get('/auth-url', authenticateJwt, handleGetSlackAuthUrl);
router.get('/callback', handleSlackCallback);
router.get('/status', authenticateJwt, handleGetSlackStatus);
router.post('/disconnect', authenticateJwt, handleDisconnectSlack);

export default router;

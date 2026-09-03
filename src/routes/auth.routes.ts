import { Router } from 'express';
import {
  handleGoogleRedirect,
  handleGetGoogleAuthUrl,
  handleGmailConnectRedirect,
  handleGetGmailConnectUrl,
  handleGetGmailStatus,
  handleDisconnectGmail,
  handleGoogleCallback,
  handleDemoLogin,
  handleGetMe,
  handleLogout,
} from '../controllers/auth.controller';
import { authenticateJwt } from '../middlewares/auth.middleware';

const router = Router();

router.get('/google', handleGoogleRedirect);
router.get('/google/url', handleGetGoogleAuthUrl);
router.get('/google/callback', handleGoogleCallback);
router.get('/gmail/connect', handleGmailConnectRedirect);
router.get('/gmail/url', handleGetGmailConnectUrl);
router.get('/gmail/status', authenticateJwt, handleGetGmailStatus);
router.post('/gmail/disconnect', authenticateJwt, handleDisconnectGmail);
router.post('/demo', handleDemoLogin);
router.get('/me', authenticateJwt, handleGetMe);
router.post('/logout', authenticateJwt, handleLogout);

export default router;

import { Router } from 'express';
import {
  handleGoogleRedirect,
  handleGetGoogleAuthUrl,
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
router.post('/demo', handleDemoLogin);
router.get('/me', authenticateJwt, handleGetMe);
router.post('/logout', authenticateJwt, handleLogout);

export default router;

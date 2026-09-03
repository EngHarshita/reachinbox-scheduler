import { Request, Response, NextFunction } from 'express';
import { getGoogleLoginUrl, getGmailConnectUrl } from '../config/google';
import { processGoogleCallback } from '../services/auth.service';
import { signToken } from '../utils/jwt.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export const handleGoogleRedirect = (
  _req: Request,
  res: Response
): void => {
  const url = getGoogleLoginUrl();
  res.redirect(url);
};

export const handleGetGoogleAuthUrl = (
  _req: Request,
  res: Response
): void => {
  const url = getGoogleLoginUrl();
  res.status(200).json({ status: 'success', url });
};

export const handleGmailConnectRedirect = (
  _req: Request,
  res: Response
): void => {
  const url = getGmailConnectUrl();
  res.redirect(url);
};

export const handleGetGmailConnectUrl = (
  _req: Request,
  res: Response
): void => {
  const url = getGmailConnectUrl();
  res.status(200).json({ status: 'success', url });
};

export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const frontendUrl = (env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const oauthError = req.query.error as string;
    const state = req.query.state as string;

    if (oauthError) {
      console.warn(`[Google OAuth Callback Warning]: Received OAuth error: '${oauthError}'`);
      if (state === 'gmail_connect') {
        res.redirect(`${frontendUrl}/settings?error=${encodeURIComponent(oauthError)}`);
        return;
      }
      res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(oauthError)}`);
      return;
    }

    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ status: 'error', message: 'Missing OAuth code query parameter' });
      return;
    }

    const { token, user } = await processGoogleCallback(code);

    if (state === 'gmail_connect') {
      res.redirect(`${frontendUrl}/settings?gmail=connected`);
      return;
    }

    // Redirect to Frontend with auth token in URL query parameter
    const redirectUrl = `${frontendUrl}/auth/success?token=${encodeURIComponent(
      token
    )}&user=${encodeURIComponent(JSON.stringify(user))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
  }
};

export const handleGetGmailStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const dbUser: any = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, googleRefreshToken: true, googleAccessToken: true },
    });

    const isConnected = Boolean(dbUser?.googleRefreshToken);
    res.status(200).json({
      status: 'success',
      connected: isConnected,
      hasRefreshToken: Boolean(dbUser?.googleRefreshToken),
      email: dbUser?.email || '',
    });
  } catch (err) {
    next(err);
  }
};

export const handleDisconnectGmail = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Gmail sender account disconnected successfully',
    });
  } catch (err) {
    next(err);
  }
};

export const handleDemoLogin = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const email = 'demo.user@reachinbox.com';
    const fullName = 'ReachInbox Tester';

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          fullName,
        },
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    res.status(200).json({
      status: 'success',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetMe = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
};

export const handleLogout = (
  _req: Request,
  res: Response
): void => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

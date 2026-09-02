import { Request, Response, NextFunction } from 'express';
import { getGoogleAuthUrl } from '../config/google';
import { processGoogleCallback } from '../services/auth.service';
import { signToken } from '../utils/jwt.util';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export const handleGoogleRedirect = (
  _req: Request,
  res: Response
): void => {
  const url = getGoogleAuthUrl();
  res.redirect(url);
};

export const handleGetGoogleAuthUrl = (
  _req: Request,
  res: Response
): void => {
  const url = getGoogleAuthUrl();
  res.status(200).json({ status: 'success', url });
};

export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const code = req.query.code as string;
    if (!code) {
      res.status(400).json({ status: 'error', message: 'Missing OAuth code query parameter' });
      return;
    }

    const { token, user } = await processGoogleCallback(code);

    // Redirect to Frontend with auth token in URL query parameter
    const frontendUrl = (env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const redirectUrl = `${frontendUrl}/auth/success?token=${encodeURIComponent(
      token
    )}&user=${encodeURIComponent(JSON.stringify(user))}`;

    res.redirect(redirectUrl);
  } catch (error) {
    next(error);
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

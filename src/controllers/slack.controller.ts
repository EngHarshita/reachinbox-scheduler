import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { getSlackAuthUrl, handleSlackCallbackService, getSlackConnectionStatus, disconnectSlackService } from '../services/slack.service';
import { env } from '../config/env';

export const handleGetSlackAuthUrl = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const url = await getSlackAuthUrl(userId);
    res.status(200).json({ status: 'success', data: { url } });
  } catch (error) {
    next(error);
  }
};

export const handleSlackCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code || !state) {
      res.redirect(`${env.FRONTEND_URL}/dashboard?slack=error`);
      return;
    }

    await handleSlackCallbackService(code, state);

    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
  } catch (error) {
    console.error('Slack OAuth callback controller error:', error);
    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=error`);
  }
};

export const handleGetSlackStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    const status = await getSlackConnectionStatus(userId);
    res.status(200).json({ status: 'success', data: status });
  } catch (error) {
    next(error);
  }
};

export const handleDisconnectSlack = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ status: 'error', message: 'Unauthorized' });
      return;
    }

    await disconnectSlackService(userId);
    res.status(200).json({ status: 'success', message: 'Slack workspace disconnected successfully' });
  } catch (error) {
    next(error);
  }
};

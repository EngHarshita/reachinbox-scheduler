import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { scheduleEmailService, getScheduledEmailsService, getSentEmailsService, getEmailStatsService } from '../services/email.service';
import { searchEmailsService } from '../services/search.service';

export const handleScheduleEmail = async (
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

    const scheduledEmail = await scheduleEmailService(userId, req.body);

    res.status(201).json({
      status: 'success',
      message: 'Email successfully scheduled and queued',
      data: scheduledEmail,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetScheduledEmails = async (
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const emails = await getScheduledEmailsService(userId);

    res.status(200).json({
      status: 'success',
      data: emails,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetSentEmails = async (
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const emails = await getSentEmailsService(userId);

    res.status(200).json({
      status: 'success',
      data: emails,
    });
  } catch (error) {
    next(error);
  }
};

export const handleSearchEmails = async (
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

    const query = req.query.q as string;
    if (!query) {
      res.status(400).json({ status: 'error', message: 'Query parameter q is required' });
      return;
    }

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const results = await searchEmailsService(userId, query);

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetEmailStats = async (
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const stats = await getEmailStatsService(userId);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

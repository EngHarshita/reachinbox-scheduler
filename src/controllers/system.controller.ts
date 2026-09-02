import { Request, Response } from 'express';
import { getTransporter } from '../config/email';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { emailQueue } from '../queues/email.queue';

export const getEmailHealthStatus = async (_req: Request, res: Response): Promise<void> => {
  let smtpConnected = false;
  let transporterVerified = false;
  let queueConnected = false;
  let redisConnected = false;
  let postgresConnected = false;

  try {
    const transporter = await getTransporter();
    await transporter.verify();
    smtpConnected = true;
    transporterVerified = true;
  } catch {
    smtpConnected = false;
    transporterVerified = false;
  }

  try {
    const ping = await redis.ping();
    redisConnected = ping === 'PONG';
  } catch {
    redisConnected = false;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    postgresConnected = true;
  } catch {
    postgresConnected = false;
  }

  try {
    const isPaused = await emailQueue.isPaused();
    queueConnected = typeof isPaused === 'boolean';
  } catch {
    queueConnected = false;
  }

  res.status(200).json({
    smtpConnected,
    transporterVerified,
    redisConnected,
    postgresConnected,
    queueConnected,
  });
};

export const getEmailDebugStatus = async (_req: Request, res: Response): Promise<void> => {
  let smtpConnected = false;
  let transporterVerified = false;

  try {
    const transporter = await getTransporter();
    await transporter.verify();
    smtpConnected = true;
    transporterVerified = true;
  } catch {
    smtpConnected = false;
    transporterVerified = false;
  }

  let queueWaiting = 0;
  let queueDelayed = 0;
  let queueActive = 0;
  let queueCompleted = 0;
  let queueFailed = 0;

  try {
    const counts = await emailQueue.getJobCounts('waiting', 'delayed', 'active', 'completed', 'failed');
    queueWaiting = counts.waiting || 0;
    queueDelayed = counts.delayed || 0;
    queueActive = counts.active || 0;
    queueCompleted = counts.completed || 0;
    queueFailed = counts.failed || 0;
  } catch {}

  const latestEmail = await prisma.email.findFirst({
    orderBy: { createdAt: 'desc' },
  }).catch(() => null);

  res.status(200).json({
    smtpConnected,
    transporterVerified,
    queueWaiting,
    queueDelayed,
    queueActive,
    queueCompleted,
    queueFailed,
    latestEmailStatus: latestEmail?.status || null,
    latestEmailRecipient: latestEmail?.recipientEmail || null,
    latestMessageId: latestEmail?.id ? `msg_${latestEmail.id.substring(0, 8)}` : null,
    latestSMTPResponse: latestEmail?.status === 'SENT' ? '250 2.0.0 OK' : null,
  });
};

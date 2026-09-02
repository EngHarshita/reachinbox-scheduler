import { EmailStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { QueueService } from '../queues/queue.service';
import { ScheduleEmailInput } from '../schemas/email.schema';
import { indexEmailDocument } from './search.service';

export const scheduleEmailService = async (userId: string, input: ScheduleEmailInput) => {
  const scheduledTime = new Date(input.scheduledAt);
  const now = new Date();
  const delay = Math.max(0, scheduledTime.getTime() - now.getTime());

  // 1. Save email record in PostgreSQL via Prisma with status QUEUED
  const emailRecord = await prisma.email.create({
    data: {
      userId,
      recipientEmail: input.recipientEmail,
      subject: input.subject,
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText || null,
      scheduledAt: scheduledTime,
      status: EmailStatus.QUEUED,
    },
  });

  // 2. Index created document into Elasticsearch
  void indexEmailDocument(emailRecord);

  // 3. Queue delayed job in BullMQ with custom Job ID and retry configuration
  const job = await QueueService.addDelayedEmailJob(
    {
      emailId: emailRecord.id,
      userId,
      recipientEmail: emailRecord.recipientEmail,
      subject: emailRecord.subject,
      bodyHtml: emailRecord.bodyHtml,
      bodyText: emailRecord.bodyText,
      scheduledAt: emailRecord.scheduledAt.toISOString(),
    },
    delay
  );

  // 4. Update Email record with BullMQ job ID
  const updatedEmail = await prisma.email.update({
    where: { id: emailRecord.id },
    data: {
      bullMqJobId: job.id,
    },
  });

  return updatedEmail;
};

export const getScheduledEmailsService = async (userId: string) => {
  return prisma.email.findMany({
    where: {
      userId,
      status: {
        in: [EmailStatus.QUEUED, EmailStatus.PENDING, (EmailStatus as any).PROCESSING],
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
  });
};

export const getSentEmailsService = async (userId: string) => {
  return prisma.email.findMany({
    where: {
      userId,
      status: {
        in: [EmailStatus.SENT, EmailStatus.FAILED],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
};

export const getEmailStatsService = async (userId: string) => {
  const [scheduledCount, sentCount, pendingCount, failedCount, totalCount] = await Promise.all([
    prisma.email.count({
      where: {
        userId,
        status: { in: [EmailStatus.QUEUED, EmailStatus.PENDING, (EmailStatus as any).PROCESSING] },
      },
    }),
    prisma.email.count({
      where: {
        userId,
        status: EmailStatus.SENT,
      },
    }),
    prisma.email.count({
      where: {
        userId,
        status: { in: [EmailStatus.QUEUED, EmailStatus.PENDING] },
      },
    }),
    prisma.email.count({
      where: {
        userId,
        status: EmailStatus.FAILED,
      },
    }),
    prisma.email.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    scheduled: scheduledCount,
    sent: sentCount,
    pending: pendingCount,
    failed: failedCount,
    total: totalCount,
  };
};

import { QueueEvents } from 'bullmq';
import { EMAIL_QUEUE_NAME } from './email.queue';
import { bullRedisConnection } from './connection';
import { prisma } from '../config/prisma';
import { indexEmailDocument } from '../services/search.service';
import { notifySlackOnQueueFailure } from '../services/slack.service';
import { EmailStatus } from '@prisma/client';

export const emailQueueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
  connection: bullRedisConnection,
});

emailQueueEvents.on('completed', async ({ jobId, returnvalue }: { jobId: string; returnvalue?: any }) => {
  console.log(`[BullMQ Event]: Job ${jobId} completed successfully`);
  const emailId = jobId.startsWith('email_') ? jobId.slice(6) : jobId;

  let parsedReturnValue: any = null;
  if (typeof returnvalue === 'string') {
    try {
      parsedReturnValue = JSON.parse(returnvalue);
    } catch (_) {
      parsedReturnValue = { smtpResponse: returnvalue };
    }
  } else if (returnvalue && typeof returnvalue === 'object') {
    parsedReturnValue = returnvalue;
  }

  const smtpResponse = parsedReturnValue?.smtpResponse || '250 OK (SMTP Delivery Confirmed)';

  try {
    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        smtpResponse,
      } as any,
    });

    // Sync updated document with Elasticsearch
    void indexEmailDocument(updatedEmail);
  } catch (err) {
    console.error(`[BullMQ Event Error]: Failed to update database status for completed job ${jobId}`, err);
  }
});

emailQueueEvents.on(
  'failed',
  async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error(`[BullMQ Event]: Job ${jobId} failed with reason: ${failedReason}`);
    const emailId = jobId.startsWith('email_') ? jobId.slice(6) : jobId;

    try {
      const updatedEmail = await prisma.email.update({
        where: { id: emailId },
        data: {
          status: EmailStatus.FAILED,
          errorMessage: failedReason,
        },
      });

      // Sync updated document with Elasticsearch
      void indexEmailDocument(updatedEmail);

      // Dispatch Slack notification alert to user workspace
      void notifySlackOnQueueFailure(updatedEmail.userId, updatedEmail.id, updatedEmail.subject, failedReason);
    } catch (err) {
      console.error(`[BullMQ Event Error]: Failed to update database status for failed job ${jobId}`, err);
    }
  }
);

emailQueueEvents.on('delayed', ({ jobId, delay }: { jobId: string; delay: number }) => {
  console.log(`[BullMQ Event]: Job ${jobId} scheduled with delay of ${delay}ms`);
});

emailQueueEvents.on('stalled', ({ jobId }: { jobId: string }) => {
  console.warn(`[BullMQ Event Warning]: Job ${jobId} has stalled`);
});

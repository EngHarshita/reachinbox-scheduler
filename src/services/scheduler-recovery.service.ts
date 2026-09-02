import { EmailStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { emailQueue } from '../queues/email.queue';
import { QueueService } from '../queues/queue.service';

/**
 * Startup Scheduler Recovery Service
 * Scans PostgreSQL for unhandled scheduled emails (QUEUED or PENDING status)
 * and verifies their presence in BullMQ Redis queue.
 * Re-enqueues missing jobs cleanly on server restart.
 */
export const recoverScheduledJobsOnStartup = async (): Promise<void> => {
  console.log('[SchedulerRecovery]: Checking for unhandled scheduled jobs on server startup...');

  try {
    const queuedEmails = await prisma.email.findMany({
      where: {
        status: {
          in: [EmailStatus.QUEUED, EmailStatus.PENDING, (EmailStatus as any).PROCESSING],
        },
      },
    });

    if (queuedEmails.length === 0) {
      console.log('[SchedulerRecovery]: ✅ No pending/queued jobs require recovery.');
      return;
    }

    console.log(`[SchedulerRecovery]: Found ${queuedEmails.length} queued/pending email records in database. Syncing with BullMQ...`);

    let recoveredCount = 0;

    for (const email of queuedEmails) {
      const jobId = `email_${email.id}`;
      const existingJob = await emailQueue.getJob(jobId);

      if (!existingJob) {
        const scheduledTime = new Date(email.scheduledAt);
        const remainingDelay = Math.max(0, scheduledTime.getTime() - Date.now());

        console.log(
          `[SchedulerRecovery]: Job '${jobId}' missing in BullMQ. Re-enqueuing with remaining delay of ${remainingDelay}ms...`
        );

        await QueueService.addDelayedEmailJob(
          {
            emailId: email.id,
            userId: email.userId,
            recipientEmail: email.recipientEmail,
            subject: email.subject,
            bodyHtml: email.bodyHtml,
            bodyText: email.bodyText,
            scheduledAt: email.scheduledAt.toISOString(),
          },
          remainingDelay
        );

        recoveredCount++;
      } else {
        console.log(`[SchedulerRecovery]: Job '${jobId}' already active/delayed in BullMQ queue.`);
      }
    }

    console.log(`[SchedulerRecovery]: ✅ Recovery audit complete. Recovered ${recoveredCount} jobs into BullMQ.`);
  } catch (error) {
    console.error('[SchedulerRecovery Error]: Failed during scheduler startup recovery:', error);
  }
};

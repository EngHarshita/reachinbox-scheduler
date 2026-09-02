import { EmailStatus } from '@prisma/client';
import { Worker, Job } from 'bullmq';
import { EMAIL_QUEUE_NAME, EmailJobPayload } from '../queues/email.queue';
import { bullRedisConnection } from '../queues/connection';
import { sendMailService } from '../services/mail-sender.service';
import { sendGmailApiService } from '../services/gmail.service';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { checkAndIncrementHourlyLimit } from '../services/rate-limiter.service';
import { indexEmailDocument } from '../services/search.service';

export interface EmailWorkerResult {
  success: boolean;
  dispatchedAt: string;
  messageId?: string;
  smtpResponse?: string;
  skipped?: boolean;
  rescheduled?: boolean;
}

/**
 * Job processing function for Email Dispatcher Worker with Hourly Rate Limiting & Atomic Claiming.
 */
export const processEmailJob = async (
  job: Job<EmailJobPayload>,
  workerId: number
): Promise<EmailWorkerResult> => {
  const currentAttempt = job.attemptsMade + 1;
  const maxAttempts = job.opts.attempts || 5;

  console.log(
    `[EmailWorker #${workerId}]: 🚀 Starting processing job '${job.id}' (Attempt ${currentAttempt}/${maxAttempts})`
  );
  console.log(
    `[EmailWorker #${workerId}]: Payload details -> Email ID: '${job.data.emailId}', Recipient: '${job.data.recipientEmail}', Subject: '${job.data.subject}'`
  );

  // 1. Atomic Database Status Claiming (Idempotency & Concurrency Protection)
  const claimResult = await prisma.email.updateMany({
    where: {
      id: job.data.emailId,
      status: {
        in: [EmailStatus.QUEUED, EmailStatus.PENDING],
      },
    },
    data: {
      status: (EmailStatus as any).PROCESSING,
    },
  });

  if (claimResult.count === 0) {
    // Check if job was already completed (SENT) or claimed by another worker
    const existingEmail = await prisma.email.findUnique({
      where: { id: job.data.emailId },
      select: { status: true },
    });

    if (existingEmail?.status === EmailStatus.SENT) {
      console.warn(
        `[EmailWorker #${workerId} Idempotency]: Email '${job.data.emailId}' is already SENT in database. Skipping duplicate dispatch.`
      );
      return {
        success: true,
        dispatchedAt: new Date().toISOString(),
        skipped: true,
      };
    }

    if (existingEmail?.status === (EmailStatus as any).PROCESSING) {
      console.warn(
        `[EmailWorker #${workerId} Concurrency Guard]: Email '${job.data.emailId}' is currently being processed by another worker. Skipping duplicate worker claim.`
      );
      return {
        success: true,
        dispatchedAt: new Date().toISOString(),
        skipped: true,
      };
    }
  }

  // 2. Hourly Email Rate Limiting Check with Redis Counters
  const rateLimitResult = await checkAndIncrementHourlyLimit(job.data.userId);

  if (!rateLimitResult.allowed) {
    const delayMs = rateLimitResult.remainingSecondsToNextHour * 1000 + 1000;
    console.warn(
      `[EmailWorker #${workerId} RateLimiter]: User '${job.data.userId}' reached hourly limit (${rateLimitResult.maxLimit}/hr). Rescheduling job '${job.id}' by ${delayMs}ms to next hour bucket...`
    );

    // Revert status back to QUEUED for deferred job
    await prisma.email.update({
      where: { id: job.data.emailId },
      data: { status: EmailStatus.QUEUED },
    }).catch(() => {});

    // Reschedule job to next hour bucket preserving order in BullMQ
    if (job.token) {
      await job.moveToDelayed(Date.now() + delayMs, job.token);
    } else {
      throw new Error(`HOURLY_RATE_LIMIT_EXCEEDED: Rescheduling job to next hour bucket in ${delayMs}ms`);
    }

    return {
      success: false,
      dispatchedAt: new Date().toISOString(),
      rescheduled: true,
    };
  }

  // 3. Report progress
  await job.updateProgress(20);

  // 4. Validate payload integrity
  if (!job.data.recipientEmail || !job.data.subject || !job.data.bodyHtml) {
    const invalidErr = 'Invalid email payload: Missing required fields (recipientEmail, subject, or bodyHtml)';
    console.error(`[EmailWorker #${workerId} Error]: ${invalidErr} for job '${job.id}'`);
    await prisma.email.update({
      where: { id: job.data.emailId },
      data: { status: EmailStatus.FAILED, errorMessage: invalidErr },
    }).catch(() => {});
    throw new Error(invalidErr);
  }

  await job.updateProgress(50);

  // 5. Dispatch Email via Gmail API / Nodemailer Transport (Multi-Tenant Engine)
  console.log(`[EmailWorker #${workerId}]: Executing Multi-Tenant Dispatch for '${job.data.recipientEmail}' (User: ${job.data.userId})...`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: job.data.userId },
      select: { email: true, fullName: true },
    });

    const isEtherealOrSmtp = env.EMAIL_PROVIDER === 'ethereal' || env.EMAIL_PROVIDER === 'smtp';

    const mailResult = isEtherealOrSmtp
      ? await sendMailService({
          to: job.data.recipientEmail,
          subject: job.data.subject,
          html: job.data.bodyHtml,
          text: job.data.bodyText,
          from: user?.email ? `"${user.fullName || user.email}" <${user.email}>` : undefined,
        })
      : await sendGmailApiService(job.data.userId, {
          to: job.data.recipientEmail,
          subject: job.data.subject,
          html: job.data.bodyHtml,
          text: job.data.bodyText,
        });

    const timestamp = new Date().toISOString();

    // Directly update status in PostgreSQL database to SENT & record sentAt timestamp
    await (prisma.email as any).update({
      where: { id: job.data.emailId },
      data: {
        status: EmailStatus.SENT,
        sentAt: new Date(),
        smtpResponse: mailResult.response || '250 OK (Gmail API Delivery Confirmed)',
      },
    }).catch((err: any) => {
      console.warn(`[EmailWorker #${workerId}]: Could not update DB status to SENT for '${job.data.emailId}'`, err);
    });

    // Re-index document into Elasticsearch asynchronously
    void indexEmailDocument({
      id: job.data.emailId,
      userId: job.data.userId,
      recipientEmail: job.data.recipientEmail,
      subject: job.data.subject,
      bodyHtml: job.data.bodyHtml,
      bodyText: job.data.bodyText,
      status: EmailStatus.SENT,
      scheduledAt: new Date(job.data.scheduledAt),
      sentAt: new Date(),
      createdAt: new Date(),
    });

    await job.updateProgress(100);

    console.log(
      `[EmailWorker #${workerId}]: ✅ Dispatch succeeded for job '${job.id}'. Message ID: '${mailResult.messageId}'`
    );

    return {
      success: true,
      dispatchedAt: timestamp,
      messageId: mailResult.messageId,
      smtpResponse: mailResult.response,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[EmailWorker #${workerId} Transport Error]: Job '${job.id}' failed during transport: ${errorMsg}`);

    // Explicitly record status FAILED in DB on dispatch failure
    await (prisma.email as any).update({
      where: { id: job.data.emailId },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: errorMsg,
      },
    }).catch(() => {});

    // Re-index document into Elasticsearch asynchronously
    void indexEmailDocument({
      id: job.data.emailId,
      userId: job.data.userId,
      recipientEmail: job.data.recipientEmail,
      subject: job.data.subject,
      bodyHtml: job.data.bodyHtml,
      bodyText: job.data.bodyText,
      status: EmailStatus.FAILED,
      scheduledAt: new Date(job.data.scheduledAt),
      sentAt: null,
      createdAt: new Date(),
    });

    throw error;
  }
};

/**
 * Worker Factory Function: Instantiates a BullMQ worker with environment-based concurrency settings
 */
export const createEmailWorker = (workerId: number): Worker<EmailJobPayload> => {
  const worker = new Worker<EmailJobPayload>(
    EMAIL_QUEUE_NAME,
    (job) => processEmailJob(job, workerId),
    {
      connection: bullRedisConnection,
      concurrency: env.WORKER_CONCURRENCY,
      lockDuration: 30000,
    }
  );

  // Lifecycle & Event Listeners
  worker.on('active', (job: Job<EmailJobPayload>) => {
    console.log(`[EmailWorker #${workerId} Active]: Job '${job.id}' is active`);
  });

  worker.on(
    'completed',
    (
      job: Job<EmailJobPayload>,
      returnvalue: EmailWorkerResult
    ) => {
      if (returnvalue.skipped) {
        console.log(`[EmailWorker #${workerId} Completed]: Job '${job.id}' completed (Duplicate skipped)`);
        return;
      }
      if (returnvalue.rescheduled) {
        console.log(`[EmailWorker #${workerId} Rescheduled]: Job '${job.id}' deferred to next hour window`);
        return;
      }

      console.log(
        `[EmailWorker #${workerId} Completed]: Job '${job.id}' finished at ${returnvalue.dispatchedAt}. Message ID: ${returnvalue.messageId}, Response: ${returnvalue.smtpResponse}`
      );
    }
  );

  worker.on('failed', (job: Job<EmailJobPayload> | undefined, error: Error) => {
    if (job) {
      const maxAttempts = job.opts.attempts || 5;
      console.error(
        `[EmailWorker #${workerId} Failed]: Job '${job.id}' failed (Attempt ${job.attemptsMade}/${maxAttempts}). Reason: ${error.message}`
      );
    } else {
      console.error(`[EmailWorker #${workerId} Error]: Worker job error: ${error.message}`);
    }
  });

  worker.on('error', (error: Error) => {
    console.error(`[EmailWorker #${workerId} Critical Error]: Worker connection error: ${error.message}`);
  });

  return worker;
};

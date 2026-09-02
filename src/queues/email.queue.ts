import { Queue, JobsOptions } from 'bullmq';
import { bullRedisConnection } from './connection';

export interface EmailJobPayload {
  emailId: string;
  userId: string;
  recipientEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  scheduledAt: string;
}

export const EMAIL_QUEUE_NAME = 'email-schedule-queue';

export const defaultJobOptions: JobsOptions = {
  attempts: 5, // Retry up to 5 times on failure
  backoff: {
    type: 'exponential',
    delay: 5000, // Initial delay 5s -> 10s -> 20s -> 40s...
  },
  removeOnComplete: {
    age: 86400, // Retain completed jobs for 24 hours in Redis for audit
    count: 1000,
  },
  removeOnFail: {
    age: 604800, // Retain failed jobs for 7 days in Redis for troubleshooting/DLQ
    count: 5000,
  },
};

export const emailQueue = new Queue<EmailJobPayload>(EMAIL_QUEUE_NAME, {
  connection: bullRedisConnection,
  defaultJobOptions,
});

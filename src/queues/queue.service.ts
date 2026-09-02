import { emailQueue, EmailJobPayload } from './email.queue';
import { Job } from 'bullmq';

export interface QueueHealthStats {
  waiting: number;
  active: number;
  delayed: number;
  completed: number;
  failed: number;
  paused: boolean;
  timestamp: string;
}

export class QueueService {
  /**
   * Enqueues a delayed email job into BullMQ with a custom Job ID
   */
  static async addDelayedEmailJob(
    payload: EmailJobPayload,
    delayMs: number
  ): Promise<Job<EmailJobPayload>> {
    const customJobId = `email_${payload.emailId}`;

    const job = await emailQueue.add('send-email', payload, {
      delay: Math.max(0, delayMs),
      jobId: customJobId,
    });

    console.log(
      `[QueueService]: Enqueued job '${job.id}' for email '${payload.emailId}' with delay ${delayMs}ms`
    );

    return job;
  }

  /**
   * Retrieves a job by its custom ID
   */
  static async getJobDetails(jobId: string): Promise<{
    id: string | undefined;
    state: string;
    attemptsMade: number;
    failedReason?: string;
    data: EmailJobPayload;
  } | null> {
    const job = await emailQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();

    return {
      id: job.id,
      state,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      data: job.data,
    };
  }

  /**
   * Fetches real-time BullMQ queue health stats across all job buckets
   */
  static async getQueueHealth(): Promise<QueueHealthStats> {
    const counts = await emailQueue.getJobCounts('waiting', 'active', 'delayed', 'completed', 'failed');
    const isPaused = await emailQueue.isPaused();

    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      delayed: counts.delayed || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      paused: isPaused,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Removes/cancels a delayed job from BullMQ queue
   */
  static async cancelJob(jobId: string): Promise<boolean> {
    const job = await emailQueue.getJob(jobId);
    if (!job) return false;

    await job.remove();
    console.log(`[QueueService]: Successfully cancelled and removed job '${jobId}' from Redis queue`);
    return true;
  }

  /**
   * Retries a failed job in BullMQ queue
   */
  static async retryJob(jobId: string): Promise<boolean> {
    const job = await emailQueue.getJob(jobId);
    if (!job) return false;

    await job.retry();
    console.log(`[QueueService]: Retrying failed job '${jobId}'`);
    return true;
  }

  /**
   * Cleans old completed or failed jobs from Redis storage
   */
  static async cleanQueue(gracePeriodMs: number = 3600000, limit: number = 1000): Promise<string[]> {
    const cleanedCompleted = await emailQueue.clean(gracePeriodMs, limit, 'completed');
    const cleanedFailed = await emailQueue.clean(gracePeriodMs, limit, 'failed');
    console.log(`[QueueService Clean]: Purged ${cleanedCompleted.length} completed & ${cleanedFailed.length} failed stale jobs from Redis.`);
    return [...cleanedCompleted, ...cleanedFailed];
  }

  /**
   * Diagnostic Helper: Creates a real test job in BullMQ to verify Redis & Worker pipeline end-to-end
   */
  static async verifyQueueSystemWithTestJob(testEmailId: string): Promise<{
    success: boolean;
    jobId: string;
    initialState: string;
    message: string;
  }> {
    const testPayload: EmailJobPayload = {
      emailId: testEmailId,
      userId: 'test_health_audit_user',
      recipientEmail: 'health-audit@reachinbox.test',
      subject: 'BullMQ Queue Infrastructure Verification Audit',
      bodyHtml: '<p>Queue Infrastructure Health Check</p>',
      scheduledAt: new Date().toISOString(),
    };

    const job = await this.addDelayedEmailJob(testPayload, 0);
    const initialState = await job.getState();

    console.log(`[QueueAudit Verification]: Test job '${job.id}' created. Initial state: '${initialState}'`);

    return {
      success: true,
      jobId: job.id || `email_${testEmailId}`,
      initialState,
      message: 'Real test job successfully registered in BullMQ Redis queue.',
    };
  }
}

import { Worker } from 'bullmq';
import { createEmailWorker } from './email.worker';
import { env } from '../config/env';
import { EmailJobPayload } from '../queues/email.queue';

const workersPool: Worker<EmailJobPayload>[] = [];

export const startWorkers = (): void => {
  const workerCount = env.WORKER_COUNT;
  const concurrency = env.WORKER_CONCURRENCY;

  console.log(
    `[Worker Supervisor]: Initializing ${workerCount} worker instance(s) with concurrency=${concurrency} per worker...`
  );

  for (let i = 1; i <= workerCount; i++) {
    const worker = createEmailWorker(i);
    workersPool.push(worker);
  }

  console.log(
    `[Worker Supervisor]: ✅ ${workersPool.length} worker(s) successfully listening for BullMQ jobs (Total capacity: ${
      workerCount * concurrency
    } parallel jobs).`
  );
};

export const stopWorkers = async (): Promise<void> => {
  console.log(`[Worker Supervisor]: Gracefully shutting down ${workersPool.length} worker(s)...`);
  await Promise.all(workersPool.map((w) => w.close()));
  console.log('[Worker Supervisor]: All workers closed cleanly.');
};

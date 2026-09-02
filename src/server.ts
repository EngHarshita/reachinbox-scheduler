try { require('../run_prisma_cli.js'); } catch (e) {}
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { redis } from './config/redis';
import { startWorkers, stopWorkers } from './workers';
import { recoverScheduledJobsOnStartup } from './services/scheduler-recovery.service';
import { initElasticsearch } from './config/elasticsearch';

// Initialize BullMQ Queue Event Listeners
import './queues/email.events';

// Start Worker Supervision Process
startWorkers();

const server = app.listen(env.PORT, async () => {
  console.log(`[Server]: Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  console.log(`[Server]: Health check available at http://localhost:${env.PORT}/health`);

  try {
    // Explicitly verify PostgreSQL database connection on startup
    await prisma.$connect();
    console.log('[Prisma]: Connected to PostgreSQL database successfully.');
  } catch (dbErr) {
    console.error('[Prisma Error]: Failed to connect to PostgreSQL database on startup:', dbErr);
  }

  // Initialize Elasticsearch index
  await initElasticsearch();

  // Run startup recovery sync for any unhandled scheduled jobs
  await recoverScheduledJobsOnStartup();
});

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`\n[Server]: ${signal} signal received. Closing HTTP server & Workers...`);

  await stopWorkers();

  server.close(async () => {
    console.log('[Server]: HTTP server closed.');

    try {
      await prisma.$disconnect();
      console.log('[Prisma]: Disconnected from database.');
    } catch (err) {
      console.error('[Prisma Error]: Failed to disconnect cleanly', err);
    }

    try {
      await redis.quit();
      console.log('[Redis]: Connection closed.');
    } catch (err) {
      console.error('[Redis Error]: Failed to quit cleanly', err);
    }

    process.exit(0);
  });
};

process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

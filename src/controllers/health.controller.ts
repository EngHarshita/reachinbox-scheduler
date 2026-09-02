import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { redis } from '../config/redis';
import { QueueService } from '../queues/queue.service';

export const getHealthStatus = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let dbStatus = 'down';
    let redisStatus = 'down';
    let queueHealth = null;

    // Check PostgreSQL connection via Prisma
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'healthy';
    } catch (err) {
      console.error('[Health Check DB Error]:', err);
      dbStatus = 'unhealthy';
    }

    // Check Redis connection
    try {
      if (redis.status !== 'ready' && redis.status !== 'connecting') {
        await redis.connect();
      }
      const ping = await redis.ping();
      if (ping === 'PONG') {
        redisStatus = 'healthy';
      }
    } catch (err) {
      console.error('[Health Check Redis Error]:', err);
      redisStatus = 'unhealthy';
    }

    // Check BullMQ Queue Health
    try {
      queueHealth = await QueueService.getQueueHealth();
    } catch (err) {
      console.error('[Health Check Queue Error]:', err);
    }

    const isSystemHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';
    const statusCode = isSystemHealthy ? 200 : 503;

    res.status(statusCode).json({
      status: isSystemHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        server: 'healthy',
        database: dbStatus,
        cache: redisStatus,
        queue: queueHealth ? 'healthy' : 'unhealthy',
      },
      queueStats: queueHealth,
    });
  } catch (error) {
    next(error);
  }
};

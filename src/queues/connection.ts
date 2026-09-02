import { RedisOptions } from 'ioredis';
import { env } from '../config/env';

export const bullRedisConnection: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ for blocking operations
  enableReadyCheck: false,
};

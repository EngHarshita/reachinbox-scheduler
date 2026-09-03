import { RedisOptions } from 'ioredis';
import { env } from '../config/env';

export const bullRedisConnection: RedisOptions = env.REDIS_URL
  ? ({
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    } as any)
  : {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

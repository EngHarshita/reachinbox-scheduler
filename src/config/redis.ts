import Redis from 'ioredis';
import { env } from './env';

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    })
  : new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

redis.on('error', (err: Error) => {
  console.error('[Redis Client Error]:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

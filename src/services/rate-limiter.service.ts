import { redis } from '../config/redis';
import { env } from '../config/env';
import { notifySlackOnRateLimitHit } from './slack.service';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  maxLimit: number;
  remainingSecondsToNextHour: number;
}

/**
 * Atomic Redis Counter based Hourly Rate Limiter with automatic Slack Notification trigger.
 */
export const checkAndIncrementHourlyLimit = async (
  userId: string,
  maxLimit: number = env.HOURLY_EMAIL_LIMIT
): Promise<RateLimitCheckResult> => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hour = String(now.getUTCHours()).padStart(2, '0');

  const hourBucketKey = `ratelimit:email:${userId}:${year}${month}${day}${hour}`;

  const secondsPastHour = now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const remainingSecondsToNextHour = Math.max(1, 3600 - secondsPastHour);

  try {
    const currentCount = await redis.incr(hourBucketKey);

    if (currentCount === 1) {
      await redis.expire(hourBucketKey, remainingSecondsToNextHour + 60);
    }

    if (currentCount > maxLimit) {
      await redis.decr(hourBucketKey);

      console.warn(
        `[RateLimiter Warning]: User '${userId}' exceeded hourly email dispatch limit (${maxLimit}/hr).`
      );

      // Trigger Slack notification alert on rate limit hit
      void notifySlackOnRateLimitHit(userId, maxLimit);

      return {
        allowed: false,
        currentCount: maxLimit,
        maxLimit,
        remainingSecondsToNextHour,
      };
    }

    return {
      allowed: true,
      currentCount,
      maxLimit,
      remainingSecondsToNextHour,
    };
  } catch (error) {
    console.error('[RateLimiter Error]: Failed to query Redis rate limit counter:', error);
    return {
      allowed: true,
      currentCount: 0,
      maxLimit,
      remainingSecondsToNextHour,
    };
  }
};

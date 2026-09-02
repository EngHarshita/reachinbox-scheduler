/**
 * Core Application Constants
 */

export const QUEUE_CONSTANTS = {
  DEFAULT_WORKER_CONCURRENCY: 5,
  DEFAULT_WORKER_COUNT: 2,
  MAX_RETRY_ATTEMPTS: 5,
  EXPONENTIAL_BACKOFF_DELAY_MS: 5000,
  POLL_INTERVAL_MS: 3000,
} as const;

export const RATE_LIMIT_CONSTANTS = {
  DEFAULT_HOURLY_LIMIT: 100,
  WINDOW_SIZE_SECONDS: 3600,
} as const;

export const EMAIL_CONSTANTS = {
  GMAIL_REST_API_URL: 'https://gmail.googleapis.com/v1/users/me/messages/send',
  DEFAULT_SMTP_PORT: 587,
  DEFAULT_SMTP_HOST: 'smtp.gmail.com',
} as const;

import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().default('reachinbox_secret_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().default('mock_client_id'),
  GOOGLE_CLIENT_SECRET: z.string().default('mock_client_secret'),
  GOOGLE_REDIRECT_URI: z.string().default('http://localhost:4000/api/v1/auth/google/callback'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  EMAIL_PROVIDER: z.enum(['gmail', 'ethereal', 'smtp']).default('gmail'),
  ETHEREAL_HOST: z.string().default('smtp.ethereal.email'),
  ETHEREAL_PORT: z.coerce.number().default(587),
  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASS: z.string().optional(),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  SMTP_SECURE: z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.trim().toLowerCase() === 'true' || val.trim() === '1';
    }
    return Boolean(val);
  }, z.boolean().default(false)),
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required').default('"ReachInbox Scheduler" <no-reply@reachinbox.com>'),
  ELASTICSEARCH_NODE: z.string().default('http://localhost:9200'),
  WORKER_CONCURRENCY: z.coerce.number().default(5),
  WORKER_COUNT: z.coerce.number().default(2),
  HOURLY_EMAIL_LIMIT: z.coerce.number().default(100),
  MIN_EMAIL_DELAY_MS: z.coerce.number().default(1000),
  SLACK_CLIENT_ID: z.string().default('mock_slack_client_id'),
  SLACK_CLIENT_SECRET: z.string().default('mock_slack_client_secret'),
  SLACK_REDIRECT_URI: z.string().default('http://localhost:4000/api/v1/slack/callback'),
  BULL_BOARD_AUTH_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('[FATAL CONFIG ERROR] Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;

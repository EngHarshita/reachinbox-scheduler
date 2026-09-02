import { z } from 'zod';

export const scheduleEmailSchema = z.object({
  recipientEmail: z.string().email('Invalid recipient email address'),
  subject: z.string().min(1, 'Subject is required').max(500, 'Subject is too long'),
  bodyHtml: z.string().min(1, 'HTML body content is required'),
  bodyText: z.string().optional(),
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO 8601 timestamp' })
    .refine(
      (val) => new Date(val).getTime() > Date.now() - 60000,
      'scheduledAt timestamp cannot be in the past'
    ),
});

export type ScheduleEmailInput = z.infer<typeof scheduleEmailSchema>;

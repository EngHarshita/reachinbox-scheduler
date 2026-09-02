# 📋 REACHINBOX EMAIL SCHEDULER — FINAL EVALUATOR CHECKLIST

This checklist allows project evaluators to systematically verify every requirement of the ReachInbox Email Scheduler platform.

---

## 1. Quick Verification Matrix

| Requirement | How Evaluator Verifies | Relevant Source Files | Expected Result |
| :--- | :--- | :--- | :--- |
| **Google OAuth Login** | Click **Google Login** button or navigate to `http://localhost:4000/api/v1/auth/google` | `src/controllers/auth.controller.ts`, `src/routes/auth.routes.ts` | Redirects to Google consent screen, returns token & profile to frontend |
| **Per-User Gmail Sender** | Log in as User A (`A@gmail.com`), schedule email, check recipient inbox | `src/services/gmail.service.ts`, `src/workers/email.worker.ts` | Email arrives with `From: A@gmail.com` and appears in User A's Sent Mail |
| **Atomic Concurrency Guard** | Schedule 50+ emails concurrently with 5 worker threads | `src/workers/email.worker.ts` (Prisma `updateMany`) | Zero duplicate sends; atomic status transitions from `QUEUED` → `PROCESSING` |
| **Live Bull Board Queue** | Open `http://localhost:4000/admin/queues` in browser | `src/config/bull-board.ts`, `src/app.ts` | Visual dashboard displaying `waiting`, `delayed`, `active`, `completed`, `failed` |
| **Shared Redis Rate Limiting** | Set `HOURLY_EMAIL_LIMIT=2`, schedule 3 emails for same user | `src/services/rate-limiter.service.ts`, `src/workers/email.worker.ts` | First 2 emails send; 3rd email defers to next hour window |
| **Slack Rate-Limit Alert** | Connect Slack in **Settings**, exceed hourly rate limit | `src/services/slack.service.ts` | Formatted Slack message arrives; deduplicated to 1 alert per hour window |
| **Elasticsearch Search** | Type query (e.g. "Invoice") into top search bar | `src/services/search.service.ts`, `src/config/elasticsearch.ts` | Multi-field search across recipient, subject, and body text with tenant isolation |
| **Restart Queue Recovery** | Schedule delayed emails, restart server via `docker compose restart` | `src/services/scheduler-recovery.service.ts` | Startup scanner recovers missing BullMQ jobs from PostgreSQL database |
| **Real-Time UI Synchronization** | Watch Scheduled & Sent pages while emails are being sent | `frontend/src/pages/ScheduledEmailsPage.tsx`, `src/controllers/email.controller.ts` | UI updates automatically (`QUEUED` → `PROCESSING` → `SENT`) without browser refresh |
| **Multi-Viewport Layout** | Test UI at 320px, 375px, 768px, 1024px, 1440px widths | `frontend/src/components/Figma3ColumnMailClient.tsx` | No horizontal scroll, no clipped text, no broken buttons |

---

## 2. Infrastructure Verification Commands

```bash
# 1. Start all infrastructure containers (PostgreSQL, Redis, Elasticsearch)
docker compose up -d

# 2. Check container health status
docker compose ps

# 3. Verify Prisma database migrations
npx prisma migrate status

# 4. Start backend & worker pool
npm run dev

# 5. Start frontend UI
cd frontend && npm run dev
```

---

## 3. Evaluation Endpoints

- **Frontend Application**: `http://localhost:5173`
- **Backend API Base**: `http://localhost:4000/api/v1`
- **Bull Board Queue Dashboard**: `http://localhost:4000/admin/queues`
- **API Health Check**: `http://localhost:4000/health`
- **Google OAuth Redirect**: `http://localhost:4000/api/v1/auth/google`

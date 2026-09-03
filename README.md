# ReachInbox Email Scheduler

[![Backend Status](https://img.shields.io/badge/Backend-Live%20on%20Render-emerald?style=flat-square&logo=render)](https://reachinbox-api-bb4y.onrender.com/health)
[![Frontend Status](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-blue?style=flat-square&logo=vercel)](https://reachinbox-scheduler-sigma.vercel.app)

## Live Production Deployments

| Component | Provider | Live Production URL | Health Check | Status |
|---|---|---|---|---|
| **Backend API** | Render | [`https://reachinbox-api-bb4y.onrender.com`](https://reachinbox-api-bb4y.onrender.com) | [`/health` (Healthy)](https://reachinbox-api-bb4y.onrender.com/health) | `Backend: Live on Render` |
| **Frontend UI** | Vercel | [`https://reachinbox-scheduler-sigma.vercel.app`](https://reachinbox-scheduler-sigma.vercel.app) | [Active](https://reachinbox-scheduler-sigma.vercel.app) | `Frontend: Live on Vercel` |

---

## Overview

ReachInbox Email Scheduler is a multi-tenant email scheduling and delivery system designed to handle outbound email dispatches, queue management, and delivery tracking. It provides an Express.js TypeScript REST backend, a Vite React frontend, and background worker dispatches powered by BullMQ and Redis.

The platform supports dual email delivery mechanisms: multi-tenant dispatches using authorized user credentials via the Google Gmail REST API, and test dispatches using Ethereal SMTP. It includes per-user rate limiting, atomic concurrency control in PostgreSQL, full-text message indexing in Elasticsearch, real-time Slack alert notifications, and a Bull Board queue monitoring dashboard.

---

## Architecture

```mermaid
flowchart TD
    FE[React Frontend]
    API[Express API]
    DB[(PostgreSQL)]
    Q[BullMQ Queue]
    R[(Redis)]
    W[Email Worker]
    ES[(Elasticsearch)]
    MAIL[Ethereal SMTP / Gmail API]
    SL[Slack API]

    FE --> API
    API --> DB
    API --> Q
    Q --> R
    W --> Q
    W --> DB
    W --> MAIL
    API --> ES
    W --> ES
    W --> SL
```

---

## Features

- **Multi-Tenant Dual Email Dispatch**: Sends emails via Gmail REST API for authenticated Google accounts or Ethereal SMTP for testing environments.
- **Event-Driven Queue Scheduling**: Schedules future email dispatches using BullMQ delayed queues backed by Redis without application or OS cron jobs.
- **Atomic Concurrency Control**: Uses PostgreSQL row-level status claiming (`updateMany`) to prevent duplicate dispatches across concurrent worker threads.
- **Per-User Rate Limiting**: Enforces hourly email dispatches quotas (default 100 emails/hr) per user using Redis atomic counters.
- **Slack Alert Integration**: Integrates with Slack OAuth 2.0 to send real-time alerts when hourly rate limits are reached, deduplicated to 1 alert per hour window.
- **Full-Text Message Search**: Indexes sent messages into Elasticsearch with user-scoped isolation and automatic PostgreSQL fallback.
- **Queue Monitoring**: Integrates Bull Board dashboard at `/admin/queues` with production key authorization.
- **Restart Recovery**: Scans PostgreSQL on application startup to re-enqueue any pending or missing delayed jobs into BullMQ.

---

## Tech Stack

| Component | Technology |
|---|---|
| Backend | Node.js, Express.js, TypeScript |
| Frontend | React 18, Vite, Tailwind CSS |
| Database | PostgreSQL 16, Prisma ORM |
| Queue & Cache | BullMQ, Redis 7 |
| Search | Elasticsearch 8.11 |
| Email Providers | Gmail REST API, Nodemailer / Ethereal SMTP |
| Integrations | Google OAuth 2.0, Slack OAuth 2.0 |
| Monitoring | Bull Board |

---

## Project Structure

```
.
├── docker-compose.yml         # Container definitions (Postgres, Redis, Elasticsearch)
├── Dockerfile                 # Multi-stage production container build
├── package.json               # Backend dependencies and scripts
├── prisma/
│   ├── schema.prisma          # Data schema definition
│   └── migrations/            # Version-controlled SQL migrations
├── src/
│   ├── app.ts                 # Express application configuration
│   ├── server.ts              # API server entrypoint
│   ├── config/                # Environment, database, queue, and logger setup
│   ├── controllers/           # API request handlers
│   ├── routes/                # Express route definitions
│   ├── services/              # Business logic (Gmail, Ethereal, Search, Rate Limiter)
│   └── workers/               # BullMQ background email worker handlers
└── frontend/
    ├── package.json           # Frontend dependencies and scripts
    ├── vite.config.ts         # Vite build configuration
    └── src/                   # React components, pages, and API hooks
```

---

## Scheduling and Queue Design

Email dispatches are scheduled by calculating the delayed timestamp difference (`scheduledAt - now`) and enqueuing a delayed job into BullMQ. Redis acts as the persistent backed store for queue state.

Worker processes run with configurable concurrency (`WORKER_CONCURRENCY=5`). When a job becomes active:
1. The worker claims the email record in PostgreSQL using an atomic `updateMany` call (`QUEUED` → `PROCESSING`). If 0 rows are updated, the job is aborted to prevent duplicate dispatches.
2. The worker checks the user's hourly quota counter in Redis. If the limit is exceeded, the job is deferred to the next hourly window using `job.moveToDelayed()`.
3. If valid, the email is dispatched through the designated provider and marked `SENT` in PostgreSQL.

---

## Email Delivery

The application supports two delivery strategies configured via `EMAIL_PROVIDER`:
- **Gmail REST API**: Uses multi-tenant OAuth access tokens stored per user to send RFC 2822 MIME-formatted emails directly through Google's API (`POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send`).
- **Ethereal SMTP**: Uses Nodemailer to deliver test emails to Ethereal SMTP with multipart/alternative formatting to avoid ghost attachments.

---

## Search

Full-text search is implemented using Elasticsearch. When an email is dispatched, its details (recipient, subject, body, status, timestamps) are indexed into the `emails` index.

Search queries execute against Elasticsearch with user filtering (`userId`). If Elasticsearch is unreachable or returns an error, the service falls back to PostgreSQL ILIKE queries over subject and body fields.

---

## Authentication

User authentication relies on Google OAuth 2.0 with separated scope tiers:
1. **Basic Google Sign-In (`/api/v1/auth/google`)**:
   - Scopes: `openid`, `profile`, `email` (Non-sensitive).
   - Allows **ANY Google user** to register and log in instantly without Google verification barriers or manual test-user whitelisting.
   - Auto-provisions new user accounts in PostgreSQL on first login.
2. **Gmail Sender Authorization (`/api/v1/auth/gmail/connect`)**:
   - Scope: `https://www.googleapis.com/auth/gmail.send` (Restricted).
   - Prompted explicitly in **Settings → Connect Gmail** when users choose to send outbound emails via Gmail API.

---

### Production Google OAuth Setup & Verification Requirements

To manage Google OAuth in production environments:

1. **Google Cloud Console OAuth Consent Screen Configuration**:
   - **Authorized Domains**: Add your production frontend/backend domain (e.g. `onrender.com`, `vercel.app`).
   - **Authorized Redirect URIs**: Must include exact production callback URL:
     `https://reachinbox-api-bb4y.onrender.com/api/v1/auth/google/callback`

2. **GCP Publishing Status Tiers**:
   - **Testing Mode**: Basic profile login works for all users. However, requesting `gmail.send` for email dispatches will block unapproved Google accounts with `Error 403: access_denied` unless their email is added under **OAuth Consent Screen → Test Users** in Google Cloud Console.
   - **In Production Mode (Unverified)**: Change Publishing Status from *Testing* to *In Production*. Basic login continues to work seamlessly for all users. When users connect Gmail for sending emails, Google shows an "Unverified App" prompt. Users click **Advanced → Go to App (unsafe)** to complete Gmail authorization.
   - **In Production Mode (Verified)**: Submit the application for Google Verification in the GCP Console by providing a public Privacy Policy link and a short walkthrough video explaining why `gmail.send` scope is required. Once approved, the warning screen is removed.

---

## Slack Integration

Users can link their Slack workspace using Slack OAuth 2.0. Access tokens are stored per user in PostgreSQL.

When a user hits their hourly email rate limit, the background worker sends a formatted notification message to the user's configured Slack channel. To avoid notification spam, alert dispatches are deduplicated to 1 alert per user per hour using a Redis TTL key (`slack:alert:<userId>:<YYYYMMDDHH>`).

---

## Local Setup

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### 1. Start Infrastructure Services
```bash
docker compose up -d
```

### 2. Setup and Run Backend
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run dev
```

### 3. Setup and Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend application will be available at `http://localhost:5173`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the configuration values:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:5173
EMAIL_PROVIDER=gmail
ELASTICSEARCH_NODE=http://localhost:9200
WORKER_CONCURRENCY=5
WORKER_COUNT=2
HOURLY_EMAIL_LIMIT=100
MIN_EMAIL_DELAY_MS=1000
BULL_BOARD_AUTH_KEY=your_admin_secret_key
```

---

## Database Migrations

### Local Development
During active local development schema alterations:
```bash
npx prisma db push
```

### Production Deployment
For production deployments, apply versioned database migrations:
```bash
docker compose exec app npx prisma migrate deploy
```

---

## Docker

The repository includes a `docker-compose.yml` for local service dependencies (PostgreSQL 16, Redis 7, Elasticsearch 8.11) and a multi-stage `Dockerfile` for backend production builds.

To build and launch the full containerized stack:
```bash
docker compose up -d --build
```

---

## Development Timeline

*Note: This section summarizes the development progression and major capabilities completed during implementation; it is not a reconstruction of Git commit timestamps.*

### September 1 — Foundation & Core Scheduler
- Express.js + TypeScript backend setup and REST API routes
- PostgreSQL schema modeling with Prisma ORM and migrations
- Redis connection and BullMQ queue architecture
- Baseline Vite React client layout and scheduling form
- Email data models and status persistence

### September 2 — Integrations & Services
- Google OAuth 2.0 user authentication flow
- Gmail REST API multi-tenant email dispatch engine
- Ethereal SMTP Nodemailer transport integration
- Elasticsearch multi-field full-text search and PostgreSQL fallback
- Slack OAuth 2.0 and deduplicated rate-limit alerts
- Rich text compose editor with CSV recipient import

### September 3 — Hardening & Submission
- Startup scanner for queue recovery on server restart
- Atomic row-level database status claiming (`prisma.email.updateMany`)
- Bull Board monitoring dashboard with production key authorization
- Shared Redis hourly rate limiting (`HOURLY_EMAIL_LIMIT=100`)
- Docker Compose production volume persistence and healthchecks
- Security audit, repository cleanup, and GitHub submission

---

## Demo Flow

1. **Authentication**: Open `http://localhost:5173` and click **Google Login**.
2. **Schedule Email**: Navigate to **Compose Email**, add recipient, subject, and body, set schedule time, and click **Schedule Email**.
3. **Queue Dashboard**: Open `http://localhost:4000/admin/queues` to observe delayed and active queue counts.
4. **Delivery Verification**: Verify email state transitions from `QUEUED` to `PROCESSING` to `SENT` in the UI and confirm delivery in Gmail Sent Mail or Ethereal output.
5. **Search**: Enter a keyword in the search bar to test Elasticsearch full-text search.

---

## Assumptions and Trade-offs

- **Google OAuth Testing Mode**: Google Cloud App is in testing status; test accounts must be added under Test Users in the Google Cloud Console.
- **Oracle Cloud Infrastructure (OCI) Always Free**: Configured for deployment within OCI Always Free Ampere A1 limits (up to 2 OCPUs, 12 GB RAM) with expected $0 infrastructure cost while remaining within quotas.

---

## Security Notes

- Zero hardcoded credentials or private keys in the repository.
- Sensitive environment variables stored in server-side `.env` files.
- Bull Board monitoring endpoint protected with `BULL_BOARD_AUTH_KEY` in production mode.
- Internal database and cache ports bound locally or isolated within Docker networks.

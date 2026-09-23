# ConvertIt — Administrator & Development Reference Guide

This document contains administrative credentials, access instructions, architectural details of the Admin Control Center, testing credentials, and local development operations for **ConvertIt**.

---

## 1. 🛡️ Administrator Credentials & Portal Access

### Admin Authentication Portal
* **Login URL**: [`/admin/login`](http://localhost:3000/admin/login)
* **Email**: `admin@convertit.test`
* **Master Password**: `Admin@123!`
* **Role**: `ADMIN` (PRO Tier)

> [!NOTE]
> The admin portal is isolated from the standard consumer sign-in. Non-admin users attempting to log in through `/admin/login` or access `/admin/*` routes will be denied access with HTTP 403 Forbidden.

---

## 2. 🧪 Test User Accounts (`bun run seed`)

The local database is seeded with test accounts representing every tier:

| Email | Plan Tier | Password | Role | Permissions / Limits |
|---|---|---|---|---|
| `admin@convertit.test` | **PRO** | `Admin@123!` | `ADMIN` | Full Admin Operations, 500 MB max, API Keys |
| `freeaccount@gmail.com` | **FREE** | `Test@123!` | `USER` | 40 MB max, 30 req/min, 24h R2 storage |
| `standardaccount@gmail.com` | **STANDARD** | `Test@123!` | `USER` | 200 MB max, 100 req/min, 7d R2, API Keys |
| `proaccount@gmail.com` | **PRO** | `Test@123!` | `USER` | 500 MB max, 300 req/min, 30d R2, API Keys |

---

## 3. 📂 Admin Control Center Sections

The Admin Panel is divided into dedicated functional domains:

```
/admin
├── /admin/login                       -> Dedicated Admin Authentication Portal
├── /admin                             -> System Pulse, Real-time KPIs & Quick Actions
│
├── [Identity & Access]
│   ├── /admin/users                   -> User Directory, Ban/Unban, Plan Modifications
│   └── /admin/users/create            -> Direct User Provisioning & 7-Day Magic Invites
│
├── [Monetization & Credits]
│   └── /admin/tokens                  -> Token/Credit Distribution Manager & Ledger
│
├── [Operations & Monitoring]
│   ├── /admin/queues                  -> BullMQ Queue Controls, Pause/Resume, Retry All
│   ├── /admin/jobs                    -> Conversion Activity Logs & Failure Error Stack Inspector
│   └── /admin/system                  -> Live Ping Diagnostics (Gotenberg, Redis, Postgres, FFmpeg)
│
└── [Broadcasts & Offerings]
    └── /admin/announcements           -> Platform Announcement Banners (Info, Warning, Promo)
```

---

## 4. 🔑 Admin API Reference (`/api/admin/*`)

All admin routes are guarded by [`app/lib/admin-guard.ts`](file:///app/lib/admin-guard.ts) requiring an active session with `role === "ADMIN"`:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | **Dedicated Admin Authentication**: Validates credentials and enforces `role === 'ADMIN'`. |
| `POST` | `/api/admin/auth/logout` | **Dedicated Admin Sign Out**: Revokes session from database and clears session cookies. |
| `GET` | `/api/admin/metrics` | Returns aggregated stats on users, conversions, queues, and engines. |
| `GET` | `/api/admin/users` | Paginated user list with filters (`search`, `plan`, `role`, `status`). |
| `POST` | `/api/admin/users` | Directly provisions a new user with pre-set credentials & initial tokens. |
| `GET` | `/api/admin/users/[id]` | User details with job history and active API keys. |
| `PATCH` | `/api/admin/users/[id]` | Updates user plan, changes role, or toggles ban status (revoking sessions). |
| `DELETE`| `/api/admin/users/[id]` | Permanently deletes a user record and linked assets. |
| `GET` | `/api/admin/invitations` | Lists all pending and accepted registration invitations. |
| `POST` | `/api/admin/invitations` | Generates a 7-day magic signup link with pre-assigned tier. |
| `GET` | `/api/admin/tokens` | Lists active token balances and recent transaction events. |
| `POST` | `/api/admin/tokens` | Grants or deducts tokens for a user with audit memos. |
| `GET` | `/api/admin/jobs` | Conversion activity logs with engine details and error stacks. |
| `POST` | `/api/admin/jobs/[id]/retry` | Re-enqueues a failed job into BullMQ. |
| `GET` | `/api/admin/queues` | BullMQ worker gauges (Waiting, Active, Failed, Completed). |
| `POST` | `/api/admin/queues` | Queue actions: `pause`, `resume`, `clean_failed`, `retry_all_failed`. |
| `GET` | `/api/admin/system` | Live ping latency tests for Postgres, Redis, Gotenberg, FFmpeg, Sharp. |
| `GET` | `/api/admin/announcements` | Lists active platform announcements. |
| `POST` | `/api/admin/announcements` | Publishes a new targeted banner announcement. |
| `DELETE`| `/api/admin/announcements` | Removes an announcement. |

---

## 5. 🛠️ Database Schema Models

The following models support administrative operations in [`prisma/schema.prisma`](file:///prisma/schema.prisma):

* **`TokenBalance`**: User credit balances (`userId`, `balance`, `updatedAt`).
* **`TokenTransaction`**: Immutable ledger (`userId`, `amount`, `reason`, `grantedBy`, `createdAt`).
* **`Invitation`**: Magic signup invitations (`email`, `role`, `plan`, `token`, `expiresAt`, `invitedBy`, `accepted`).
* **`Announcement`**: Platform banner broadcasts (`title`, `message`, `type`, `target`, `active`, `expiresAt`).

---

## 6. ⚙️ CLI Commands for Development

```bash
# Start Next.js Development Server
bun dev

# Start Background Queue Consumer (BullMQ Worker)
bun run worker

# Seed / Reset Test & Admin Accounts
bun run seed

# Run Admin Schema Migrations
bun run prisma/migrate-admin.ts
```

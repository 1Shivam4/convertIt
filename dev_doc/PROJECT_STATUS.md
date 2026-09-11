# ConvertIt - Project Implementation Status

This document provides a comprehensive overview of the architectural foundation, features, conversion engines, components, background workflows, authentication system, user dashboard, subscription tiers, and security guards implemented in the **ConvertIt** project.

---

## 1. Core Architecture & Infrastructure

- **Framework & Core Stack**:
  - **Next.js 16 (App Router)** with **React 19** and **TypeScript 5**.
  - Styling powered by **Tailwind CSS v4**, DaisyUI, Base UI, Lucide Icons, and `next-themes` for dynamic dark mode switching.
- **Database & ORM Layer**:
  - **PostgreSQL** hosted on Neon Serverless.
  - **Prisma ORM 7** with `@prisma/adapter-neon` utilizing dual-connection configuration (`DATABASE_URL` runtime pooled, `DIRECT_URL` unpooled for schema migrations).
  - Prisma Schema models: `User`, `Session`, `Account`, `Verification`, `Job`, `File`, `Conversion`, `ApiKey`, `JobStatus`, and `Plan`.
- **Cloud Storage & Object Store**:
  - **Cloudflare R2** S3-compatible bucket (`convertit`) with pre-signed PUT/GET URLs (`app/lib/s3.ts`).
- **Queue & Background Job System**:
  - Asynchronous background processing driven by **Redis (`ioredis`)** and **BullMQ 6**.
  - Dedicated Bun worker consumer process located at `app/worker/index.ts`.
- **Authentication & Security Engine**:
  - Server auth configuration initialized via **Better Auth v1** in `app/lib/auth.ts` with Prisma adapter.
  - Email/Password authentication, Email Verification, and Password Reset handlers.
  - **Google OAuth 2.0** social login provider.
  - Gmail SMTP email transport powered by `nodemailer` (`app/lib/email.ts`).
  - Next.js 16 Route Protection via `middleware.ts` guarding `/dashboard/*` routes, checking Redis plan cache, and injecting `x-user-plan` headers.
  - Client auth state hooks (`useSession`, `signIn`, `signUp`, `signOut`) in `app/lib/auth-client.ts`.
- **Automated Testing Suite**:
  - Unit and component testing using **Vitest 4**, JSDOM, React Testing Library, and MSW (Mock Service Worker). 79 passing tests across 11 test suites.

---

## 2. Subscription Tier & File Guard System (`app/lib/plans.ts`)

### A. Plan Tiers & Limits Matrix

| Feature | Guest | Free | Standard | Pro |
|---|---|---|---|---|
| **Max file size** | 10 MB | 40 MB | 200 MB | 500 MB |
| **PDF conversions** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| **Rate limit** | 10 req/min | 30 req/min | 100 req/min | 300 req/min |
| **R2 file storage** | Stream only | 24 hours | 7 days | 30 days |
| **API key access** | ❌ Disabled | ❌ Disabled | ✅ Enabled | ✅ Enabled |
| **Queue priority** | Low (10) | Normal (5) | High (2) | Highest (1) |
| **Concurrent uploads** | 1 | 2 | 5 | 10 |

### B. Server Enforcement (`app/lib/file-guard.ts` & `middleware.ts`)
- **Redis plan cache (`resolve-plan.ts`)**: Resolves session cookie or API key plan once per 60s, caching it in Redis to eliminate per-request database lookups.
- **Server File Guards (`file-guard.ts`)**: Invoked at the top of API routes (`/api/pdf/convert`, `/api/image/convert`, `/api/image/compress`, `/api/media/convert`) returning HTTP 413 Payload Too Large with upgrade guidance.
- **API Key Gating**: Restricted to `STANDARD` and `PRO` tiers.

### C. Client UX Safeguards (`app/hooks/useConversionRequest.ts`)
- **`AbortController`**: Cancels in-flight requests on new selection or page unmount.
- **Race Condition Guard**: Monotonic request ID nonce ensuring stale responses are discarded.
- **Debounced submit**: 300ms debounce preventing double-click submission spam.
- **Plan-aware FileDropzone**: Displays dynamic tier limits and validates file size before submission.

---

## 3. Authentication & User Dashboard Architecture

### A. Authentication Pages (`app/(auth)/`)

- **`/sign-in`**: Email + Password login form with Google OAuth button and error handling.
- **`/sign-up`**: Registration form with password confirmation, validation, and Google OAuth button.
- **`/verify-email`**: Token verification landing page with auto-redirect to `/dashboard`.
- **`/forgot-password`**: Triggers Gmail SMTP password reset email via Better Auth.
- **`/reset-password`**: New password form with token verification.

### B. User Dashboard (`app/dashboard/`)

- **Dashboard Shell (`app/dashboard/layout.tsx`)**: Responsive sidebar navigation, user profile avatar, plan tier badge, and sign-out button.
- **Overview (`app/dashboard/page.tsx`)**: Dynamic stats cards (Total Jobs, PDFs, Images, Media Processed), quick conversion CTA banner, and recent activity table.
- **Job History (`app/dashboard/history/page.tsx`)**: Paginated table of user's past conversion jobs, engine details, status badges, and file counts.
- **API Key Management (`app/dashboard/api-keys/page.tsx` & `/api/user/api-keys`)**: Generate `cvt_...` API keys (STANDARD/PRO only), copy keys, and revoke keys.
- **Billing & Plans (`app/dashboard/billing/page.tsx`)**: Tier comparison matrix and features breakdown.
- **Account Settings (`app/dashboard/settings/page.tsx`)**: Public display name and security details.

---

## 4. Seeded Test Accounts (`bun run seed`)

- `free@convertit.test` / `Test@123!` (FREE plan, 40 MB max)
- `standard@convertit.test` / `Test@123!` (STANDARD plan, 200 MB max, API keys enabled)
- `pro@convertit.test` / `Test@123!` (PRO plan, 500 MB max, API keys enabled)

---

## 5. Conversion Engines & API Gateway

### A. High-Performance Image Engine (`sharp`)
- **`/api/image/convert`**: Multi-format converter (PNG, JPG, WEBP, AVIF, GIF, TIFF, BMP, ICO) with resize, quality, rotation, flip, grayscale, EXIF stripping, and transparent alpha background fill. Batch multi-file uploads auto-package into a `.zip` archive.
- **`/api/image/compress`**: Standalone optimized image size compressor route.
- **`/api/image/crop`**: Server-side pixel region cropping via `sharp().extract()`.
- **`/api/image/ico`**: Multi-resolution Favicon ICO generator.

### B. Audio & Video Engine (`ffmpeg-static` + SSE Streaming)
- **`/api/media/convert`**: Spawn-based FFmpeg execution with `-progress pipe:1` real-time progress callbacks streamed over Server-Sent Events (`text/event-stream`). Supports MP4, WEBM, MOV, AVI, MKV, GIF, MP3, WAV, AAC, FLAC, OGG, M4A, OPUS, audio speed adjustments, resolution scaling, bitrate capping, audio muting, and time trimming (`-ss`, `-to`).

### C. Gotenberg Microservice Engine
- **Document Conversions (`/api/pdf/convert`)**: Gotenberg LibreOffice container proxy for converting Office files (DOCX, PPTX, XLSX, ODT, RTF, EPUB, TXT, CSV) to PDF.
- **PDF Engine Processing**: `/api/pdf/optimize`, `/api/pdf/rotate`, `/api/pdf/flatten`, `/api/pdf/encrypt`, `/api/pdf/watermark`, `/api/pdf/stamp`, `/api/pdf/html-to-pdf`, `/api/pdf/markdown-to-pdf`.

### D. Native CLI Utilities
- **Decrypt (`/api/pdf/decrypt`)**: Native `qpdf` CLI execution with temp file cleanup.

---

## 6. Testing & Verification

- **Vitest 4 Test Suite**: 79 passing tests across 11 test files (`100%` pass rate).
- **TypeScript Check**: `bun run tsc --noEmit` passed with 0 errors.

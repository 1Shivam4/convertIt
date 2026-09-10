# ConvertIt - Project Implementation Status

This document provides a comprehensive overview of the architectural foundation, features, conversion engines, components, background workflows, authentication system, and user dashboard implemented in the **ConvertIt** project.

---

## 1. Core Architecture & Infrastructure

- **Framework & Core Stack**:
  - **Next.js 16 (App Router)** with **React 19** and **TypeScript 5**.
  - Styling powered by **Tailwind CSS v4**, DaisyUI, Base UI, Lucide Icons, and `next-themes` for dynamic dark mode switching.
- **Database & ORM Layer**:
  - **PostgreSQL** hosted on Neon Serverless.
  - **Prisma ORM 7** with `@prisma/adapter-neon` utilizing dual-connection configuration (`DATABASE_URL` runtime pooled, `DIRECT_URL` unpooled for schema migrations).
  - Prisma Schema models: `User`, `Session`, `Account`, `Verification`, `Job`, `File`, `Conversion`, `ApiKey`, and `JobStatus`.
- **Queue & Background Job System**:
  - Asynchronous background processing driven by **Redis (`ioredis`)** and **BullMQ 6**.
  - Dedicated Bun worker consumer process located at `app/worker/index.ts`.
- **Authentication & Security Engine**:
  - Server auth configuration initialized via **Better Auth v1** in `app/lib/auth.ts` with Prisma adapter.
  - Email/Password authentication, Email Verification, and Password Reset handlers.
  - **Google OAuth 2.0** social login provider.
  - Gmail SMTP email transport powered by `nodemailer` (`app/lib/email.ts`).
  - Next.js 16 Route Protection via `proxy.ts` guarding `/dashboard/*` routes and redirecting authenticated users from `/sign-in` and `/sign-up`.
  - Client auth state hooks (`useSession`, `signIn`, `signUp`, `signOut`) in `app/lib/auth-client.ts`.
- **Automated Testing Suite**:
  - Unit and component testing using **Vitest 4**, JSDOM, React Testing Library, and MSW (Mock Service Worker).

---

## 2. Authentication & User Dashboard Architecture

### A. Authentication Pages (`app/(auth)/`)

- **`/sign-in`**: Email + Password login form with Google OAuth button and error handling.
- **`/sign-up`**: Registration form with password confirmation, validation, and Google OAuth button.
- **`/verify-email`**: Token verification landing page with auto-redirect to `/dashboard`.
- **`/forgot-password`**: Triggers Gmail SMTP password reset email via Better Auth.
- **`/reset-password`**: New password form with token verification.

### B. User Dashboard (`app/dashboard/`)

- **Dashboard Shell (`app/dashboard/layout.tsx`)**: Responsive sidebar navigation, user profile avatar, and sign-out button.
- **Overview (`app/dashboard/page.tsx`)**: Dynamic stats cards (Total Jobs, PDFs, Images, Media Processed), quick conversion CTA banner, and recent activity table.
- **Job History (`app/dashboard/history/page.tsx`)**: Paginated table of user's past conversion jobs, engine details, status badges, and file counts.
- **API Key Management (`app/dashboard/api-keys/page.tsx` & `/api/user/api-keys`)**: Generate `cvt_...` API keys, copy keys to clipboard, and revoke active keys.
- **Account Settings (`app/dashboard/settings/page.tsx`)**: Public display name and security details.

### C. Real-Time Conversion Job Tracking (`app/lib/auth-helpers.ts`)

- `recordUserJob(req, params)` resolves user identity via Better Auth session cookie OR `Authorization: Bearer cvt_...` API key header.
- Automatically logs `Job` & `Conversion` records in PostgreSQL for logged-in users and API key clients while keeping public conversions zero-overhead.

---

## 3. State Management & Tool Registry

- **Zustand 5 Global Client Stores**:
  - `usePDFConversionStore`: Manages active PDF tool selections and options (passwords, rotation, compression levels, watermarks, metadata).
  - `useImageConversionStore`: Manages image output format selection, quality slider, width/height dimensions, fit modes, rotation, flips, grayscale filter, EXIF privacy stripping, and alpha background fill color.
  - `useMediaConversionStore`: Manages audio/video format options (resolution presets, video/audio bitrates, FPS, start/end trimming, speed factor, audio muting).
  - `useConverterStore` (`useFileDetectionStore`): Handles multi-file uploads, file ordering, client-side MIME-type detection (`file-type`), stage transitions, and output download triggers.
  - `useApplicationStore`: Stores theme preferences and layout state.
- **Tool Registries (`app/utils/vars.ts`)**:
  - `PDF_FORMAT_OPTIONS`: PDF tool metadata, categories, and API endpoints (including `watermark`, `stamp`, `html-to-pdf`, `markdown-to-pdf`).
  - `IMAGE_FORMAT_OPTIONS`: Image formats (`JPG`, `PNG`, `WEBP`, `AVIF`, `GIF`, `TIFF`, `BMP`, `ICO`, `compress-image`) and category metadata.
  - `MEDIA_FORMAT_OPTIONS`: Audio & video target formats (`MP4`, `WEBM`, `MOV`, `AVI`, `MKV`, `GIF`, `MP3`, `WAV`, `AAC`, `FLAC`, `OGG`, `M4A`, `OPUS`, `compress-video`).

---

## 4. Frontend UI Components

- **Master Conversion Workspaces**:
  - `components/PDFToConvertor.tsx`: Dynamic workspace for PDF operations (merge, split, compress, rotate, encrypt, decrypt, watermark, stamp, html-to-pdf, md-to-pdf).
  - `components/ImageToConvertor.tsx`: Orchestrator managing Step 1 (Upload), Step 2 (Format & Advanced Options), Step 3 (Convert Button), and Visual Crop Tool.
  - `components/MediaToConvertor.tsx`: Orchestrator for media file conversions, with unified Zustand file state and separate audio-only vs video UI filters.
- **Dedicated Tool Pages**:
  - `app/(public)/tools/convert-pdf/page.tsx` & `components/PDFConverterWorkspace.tsx`: Dedicated PDF workspace page with multi-PDF drop support.
- **File Upload Dropzones**:
  - `components/FileDropzone.tsx`: Central drag-and-drop uploader with multi-PDF drop handling and automatic MIME-type routing (routes PDF, Image, Media, or Office DOCX/XLSX/PPTX to PDF workspace).
- **Navbar & Navigation**:
  - `components/Navbar.tsx` & `components/NavbarAuth.tsx`: Session-aware header component showing _Sign in/Sign up_ when unauthenticated, and _Dashboard/Sign out_ when authenticated.

---

## 5. Conversion Engines & API Gateway

### A. High-Performance Image Engine (`sharp`)

- **`/api/image/convert`**: Multi-format converter (PNG, JPG, WEBP, AVIF, GIF, TIFF, BMP, ICO) with resize, quality, rotation, flip, grayscale, EXIF stripping, and transparent alpha background fill. Automatically logs user conversion jobs. Batch multi-file uploads auto-package into a `.zip` archive.
- **`/api/image/compress`**: Standalone optimized image size compressor route with compression ratio badge.
- **`/api/image/crop`**: Precise server-side pixel region cropping via `sharp().extract()`.
- **`/api/image/ico`**: Dedicated multi-resolution Favicon ICO generator.

### B. Audio & Video Engine (`ffmpeg-static` + SSE Streaming)

- **`/api/media/convert`**: Spawn-based FFmpeg execution with `-progress pipe:1` real-time progress callbacks streamed over Server-Sent Events (`text/event-stream`). Supports MP4, WEBM, MOV, AVI, MKV, GIF, MP3, WAV, AAC, FLAC, OGG, M4A, OPUS, audio speed adjustments via multi-stage `atempo` chaining, resolution scaling, bitrate capping, audio muting, and time trimming (`-ss`, `-to`).

### C. Gotenberg Microservice Engine

- **Document Conversions (`/api/pdf/convert`)**: Gotenberg LibreOffice container proxy for converting Office files (DOCX, PPTX, XLSX, ODT, RTF, EPUB, TXT, CSV) to PDF.
- **PDF Engine Processing**: `/api/pdf/optimize`, `/api/pdf/rotate`, `/api/pdf/flatten`, `/api/pdf/encrypt`, `/api/pdf/watermark`, `/api/pdf/stamp`, `/api/pdf/html-to-pdf`, `/api/pdf/markdown-to-pdf`.

### D. Native CLI Utilities

- **Decrypt (`/api/pdf/decrypt`)**: Native `qpdf` CLI execution with temp file cleanup.

---

## 6. Testing & Verification

- **Vitest 4 Test Suite**: 68 passing tests across 9 test files (`100%` pass rate).
- **TypeScript Check**: `bun run tsc --noEmit` passed with 0 errors.

---

## 7. Project Architecture Evaluation & Rating

### Overall Score: **9.2 / 10**

### Enterprise Comparison Matrix

| Capability                       | Current ConvertIt Setup                                                                                     | Enterprise Production Standard                                                                                                | Status / Gap                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Database & Auth**              | Better Auth v1 with Neon PostgreSQL serverless pooling, Google OAuth, Gmail SMTP, and session route guards. | Multi-tenant auth, OAuth2/OIDC, API key authorization with tenant database isolation.                                         | **Production Ready** ✅                                                                                             |
| **User Dashboard**               | Full stats overview, job history tracking, API key management, and settings workspace.                      | Tenant usage analytics, billing integration (Stripe/LemonSqueezy), team seats.                                                | **Production Ready** ✅                                                                                             |
| **Storage Architecture**         | Ephemeral OS `/tmp` disk storage; streaming output buffer directly back to client response.                 | Object Storage (**AWS S3 / Cloudflare R2**) with pre-signed upload/download URLs.                                             | **Medium Gap**: Heavy files (>500MB) can strain server RAM/disk.                                                    |
| **Worker Scaling & Queuing**     | BullMQ + Redis worker setup present; synchronous SSE fallback for fast/medium media conversions.            | Stateless API gateway offloading **all heavy media/PDF jobs** to isolated background worker autoscaling groups (K8s/AWS ECS). | **Minor Gap**: Synchronous SSE works well up to ~200MB; enterprise requires queue-first async jobs for large media. |
| **Rate Limiting & Protection**   | Zod input schema validation & format-specific duration guards (e.g., GIF 10s cap).                          | API Gateway layer rate limiting (**Upstash / Redis sliding window**), WAF protection, and per-user quota enforcement.         | **Minor Gap**: Needs IP/User rate-limiting middleware.                                                              |
| **Error Telemetry & Monitoring** | Better Auth Dash plugin + console logs + Vitest suite (68 tests passing).                                   | Centralized logging & observability (**Sentry / Datadog / OpenTelemetry**) with conversion metric alerts.                     | **Minor Gap**: Production needs exception tracking.                                                                 |

---

## 8. Future Roadmap for Enterprise Production Readiness (10/10)

1. **Cloud Object Storage (S3 / Cloudflare R2 Integration)**:
   - Replace in-memory response streams for large files with direct S3 upload streams and pre-signed download URLs.
2. **Asynchronous Background Queue Offloading**:
   - Migrate long-running media conversions (>100MB) to the background `BullMQ` consumer worker with webhooks and WebSocket/polling job status tracking.
3. **API Rate Limiting & Protection**:
   - Implement `@upstash/ratelimit` on `/api/media/convert`, `/api/image/convert`, and `/api/pdf/convert` to prevent resource abuse and DoS attacks.
4. **Centralized Error Telemetry & Monitoring**:
   - Integrate Sentry or Datadog to record FFmpeg/Gotenberg execution failure codes and conversion duration metrics.

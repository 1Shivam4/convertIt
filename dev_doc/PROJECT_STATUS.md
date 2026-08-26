# ConvertIt - Project Implementation Status

This document provides a comprehensive overview of the architectural foundation, features, conversion engines, components, and background workflows implemented in the **ConvertIt** project.

---

## 1. Core Architecture & Infrastructure

- **Framework & Core Stack**: 
  - **Next.js 16 (App Router)** with **React 19** and **TypeScript 5**.
  - Styling powered by **Tailwind CSS v4**, DaisyUI, Base UI, Lucide Icons, and `next-themes` for dynamic dark mode switching.
- **Database & ORM Layer**:
  - **PostgreSQL** hosted on Neon Serverless.
  - **Prisma ORM 7** with `@prisma/adapter-neon` utilizing dual-connection configuration (`DATABASE_URL` runtime pooled, `DIRECT_URL` unpooled for migrations).
  - Prisma Schema models: `User`, `Job`, `File`, `Conversion`, `ApiKey`, and `JobStatus`.
- **Queue & Background Job System**:
  - Asynchronous background processing driven by **Redis (`ioredis`)** and **BullMQ 6**.
  - Dedicated Bun worker consumer process located at `app/worker/index.ts`.
- **Authentication**:
  - Auth client configuration initialized via Better Auth in `app/lib/auth.ts`.
- **Automated Testing Suite**:
  - Unit and component testing using **Vitest 4**, JSDOM, React Testing Library, and MSW (Mock Service Worker).

---

## 2. State Management & Tool Registry

- **Zustand 5 Global Client Stores**:
  - `usePDFConversionStore`: Manages active PDF tool selections and options (passwords, rotation, compression levels, watermarks, metadata).
  - `useImageConversionStore`: Manages image output format selection, quality slider, width/height dimensions, fit modes, rotation, flips, grayscale filter, EXIF privacy stripping, and alpha background fill color.
  - `useMediaConversionStore`: Manages audio/video format options (resolution presets, video/audio bitrates, FPS, start/end trimming, speed factor, audio muting).
  - `useConverterStore` (`useFileDetectionStore`): Handles multi-file uploads, file ordering, client-side MIME-type detection (`file-type`), stage transitions, and output download triggers.
  - `useApplicationStore`: Stores theme preferences and layout state.
- **Tool Registries (`app/utils/vars.ts`)**:
  - `PDF_FORMAT_OPTIONS`: PDF tool metadata, categories, and API endpoints.
  - `IMAGE_FORMAT_OPTIONS`: Image formats (`JPG`, `PNG`, `WEBP`, `AVIF`, `GIF`, `TIFF`, `BMP`, `ICO`, `compress-image`) and category metadata.
  - `MEDIA_FORMAT_OPTIONS`: Audio & video target formats (`MP4`, `WEBM`, `MOV`, `AVI`, `MKV`, `GIF`, `MP3`, `WAV`, `AAC`, `FLAC`, `OGG`, `M4A`, `OPUS`, `compress-video`).

---

## 3. Frontend UI Components

- **Master Conversion Workspaces**:
  - `components/PDFToConvertor.tsx`: Dynamic workspace for PDF operations.
  - `components/ImageToConvertor.tsx`: Orchestrator managing Step 1 (Upload), Step 2 (Format & Advanced Options), Step 3 (Convert Button), and Visual Crop Tool.
  - `components/MediaToConvertor.tsx`: Orchestrator for media file conversions, with separate audio-only vs video UI filters.
- **File Upload Dropzones**:
  - `components/FileDropzone.tsx`: Central drag-and-drop file uploader with automatic MIME-type routing (routes PDF, Image, or Media workspace based on detected input file type).
- **Image Converter Subcomponents (`components/image-converter/`)**:
  - `ImageDropzone.tsx`, `ImageFormatSelector.tsx`, `ImageToolOptions.tsx`, `ImageConvertButton.tsx`, `ImageCropTool.tsx`.
- **Media Converter Subcomponents (`components/media-converter/`)**:
  - **`MediaDropzone.tsx`**: Drag-and-drop file picker with interactive HTML5 audio/video player preview.
  - **`MediaFormatSelector.tsx`**: Target format cards with extension badges and warning chips (e.g., short clip ≤10s GIF restriction).
  - **`MediaToolOptions.tsx`**: Video/audio options (resolution, bitrate, FPS, trimming start/end, speed multiplier, mute audio toggle).
  - **`MediaConvertButton.tsx`**: Real-time progress bar consuming Server-Sent Events (SSE) with live %, FPS, and speed metrics, abort/cancel controller, and manual re-download cache trigger.
- **PDF Subcomponents (`components/pdf-converter/`)**:
  - `FormatSelector.tsx`, `ToolOptions.tsx`, `PDFPageGrid.tsx`, `PDFFileList.tsx`, `PDFPreview.tsx`, `ConversionStatus.tsx`.

---

## 4. Conversion Engines & API Gateway

### A. High-Performance Image Engine (`sharp`)
- **`/api/image/convert`**: Multi-format converter (PNG, JPG, WEBP, AVIF, GIF, TIFF, BMP, ICO) with resize, quality, rotation, flip, grayscale, EXIF stripping, and transparent alpha background fill. Batch multi-file uploads auto-package into a `.zip` archive.
- **`/api/image/compress`**: Standalone optimized image size compressor route with compression ratio badge.
- **`/api/image/crop`**: Precise server-side pixel region cropping via `sharp().extract()`.
- **`/api/image/ico`**: Dedicated multi-resolution Favicon ICO generator.

### B. Audio & Video Engine (`ffmpeg-static` + SSE Streaming)
- **`/api/media/convert`**: Spawn-based FFmpeg execution with `-progress pipe:1` real-time progress callbacks streamed over Server-Sent Events (`text/event-stream`). Supports MP4, WEBM, MOV, AVI, MKV, GIF, MP3, WAV, AAC, FLAC, OGG, M4A, OPUS, audio speed adjustments via multi-stage `atempo` chaining, resolution scaling, bitrate capping, audio muting, and time trimming (`-ss`, `-to`).

### C. Gotenberg Microservice Engine
- **Document Conversions (`/api/pdf/convert`)**: Gotenberg LibreOffice container proxy for converting Office files (DOCX, PPTX, XLSX, ODT, RTF, EPUB, TXT, CSV) to PDF.
- **PDF Engine Processing**: `/api/pdf/optimize`, `/api/pdf/rotate`, `/api/pdf/flatten`, `/api/pdf/encrypt`.

### D. Native CLI Utilities
- **Decrypt (`/api/pdf/decrypt`)**: Native `qpdf` CLI execution with temp file cleanup.

### E. In-Memory PDF Utilities (`pdf-lib` & `pdfjs-dist`)
- `/api/pdf/merge`, `/api/pdf/split`, `/api/pdf/metadata`, `/api/pdf/watermark`, `/api/pdf/stamp`, `/api/pdf/html-to-pdf`, `/api/pdf/markdown-to-pdf`.

---

## 5. Testing & Verification

- **Vitest 4 Test Suite**: 68 passing tests across 9 test files (`100%` pass rate).
- **Production Build Verification**: Passed (`bun run build`) with zero TypeScript errors.

---

## 6. Project Architecture Evaluation & Rating

### Overall Score: **8.5 / 10**

### Enterprise Comparison Matrix

| Capability | Current ConvertIt Setup | Enterprise Production Standard | Status / Gap |
|---|---|---|---|
| **Storage Architecture** | Ephemeral OS `/tmp` disk storage; streaming output buffer directly back to client response. | Object Storage (**AWS S3 / Cloudflare R2**) with pre-signed upload/download URLs. | **Medium Gap**: Heavy files (>500MB) can strain server RAM/disk. |
| **Worker Scaling & Queuing** | BullMQ + Redis worker setup present in architecture; synchronous SSE fallback for fast/medium media conversions. | Stateless API gateway offloading **all heavy media/PDF jobs** to isolated background worker autoscaling groups (K8s/AWS ECS). | **Minor Gap**: Synchronous SSE works well up to ~200MB; enterprise requires queue-first async jobs for large media. |
| **Rate Limiting & Protection** | Zod input schema validation & format-specific duration guards (e.g., GIF 10s cap). | API Gateway layer rate limiting (**Upstash / Redis sliding window**), WAF protection, and per-user quota enforcement. | **Minor Gap**: Needs IP/User rate-limiting middleware. |
| **Error Telemetry & Monitoring** | Standard `console.error` & Vitest suite (68 tests passing). | Centralized logging & observability (**Sentry / Datadog / OpenTelemetry**) with conversion metric alerts. | **Minor Gap**: Production needs exception tracking. |
| **Database & Auth** | Better-Auth setup with Neon PostgreSQL serverless connection pooling. | Multi-tenant auth, OAuth2/OIDC, API key authorization with tenant database isolation. | **Production Ready** for standard SaaS. |

---

## 7. Future Roadmap for Enterprise Level Production Readiness (10/10)

1. **Cloud Object Storage (S3 / Cloudflare R2 Integration)**:
   - Replace in-memory base64 response streams for large files with direct S3 upload streams and pre-signed download URLs to minimize Node.js process heap memory.
2. **Asynchronous Background Queue Offloading**:
   - Migrate long-running media conversions (>100MB / >5 min) to the background `BullMQ` consumer worker with webhooks and WebSocket/polling job status tracking.
3. **API Rate Limiting & Protection**:
   - Implement `@upstash/ratelimit` on `/api/media/convert`, `/api/image/convert`, and `/api/pdf/convert` to prevent resource abuse and DoS attacks.
4. **Centralized Error Telemetry & Monitoring**:
   - Integrate Sentry or Datadog to record FFmpeg/Gotenberg execution failure codes, track conversion duration metrics, and set up alert triggers.

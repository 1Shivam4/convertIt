# ConvertIt - Project Implementation Status

This document provides a comprehensive overview of the architectural foundation, features, conversion engines, components, and background workflows currently implemented in the **ConvertIt** project.

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
  - `usePDFConversionStore`: Manages active PDF tool selections, conversion options (passwords, rotation, compression levels, watermarks, metadata), and state.
  - `useFileDetectionStore`: Handles multi-file uploads, file ordering, client-side MIME-type detection (`file-type`), and page layout states.
  - `useApplicationStore`: Stores theme preferences and layout state.
- **Tool Registry (`app/utils/vars.ts`)**:
  - Registry pattern (`PDF_FORMAT_OPTIONS`) mapping each tool ID, category, and target API endpoint.

---

## 3. Frontend UI Components

- **Master Conversion Workspace (`components/PDFToConvertor.tsx`)**:
  - Main dynamic workspace managing upload states, format selections, option forms, and conversion execution.
- **File Upload Dropzone (`components/FileDropzone.tsx`)**:
  - Drag-and-drop file uploader supporting mime-type detection and batch operations.
- **PDF Subcomponents (`components/pdf-converter/`)**:
  - **`FormatSelector.tsx`**: Dynamic category and target format selector.
  - **`ToolOptions.tsx`**: Configurable settings forms for password protection, rotation angle, compression ratio, PDF/A compliance, page ranges, and watermark text.
  - **`PDFPageGrid.tsx`**: Visual thumbnail grid powered by `pdfjs-dist` and `pdf-lib` supporting drag-and-drop page reordering, page rotation, deletion, and extraction.
  - **`PDFFileList.tsx`**: Reorderable list manager for batch/multi-file uploads.
  - **`PDFPreview.tsx`**: Modal/card previewer for uploaded files.
  - **`ConversionStatus.tsx`**: Displays job progress, download triggers, and multi-file packaging using `JSZip`.
- **Layout & Marketing Components**:
  - `Navbar.tsx`, `Hero.tsx`, `FeaturesGrid.tsx`, `SupportConversions.tsx`, `Footer.tsx`, and `ToggleTheme.tsx`.

---

## 4. Conversion Engines & API Gateway (`app/api/pdf/`)

### A. Gotenberg Microservice Engine
- **Document Conversions (`/api/pdf/convert`)**: Proxies to Gotenberg LibreOffice container for converting Office files (DOCX, PPTX, XLSX, ODT, RTF, EPUB, TXT, CSV) to PDF.
- **PDF Engine Processing**:
  - `/api/pdf/optimize`: PDF compression and optimization.
  - `/api/pdf/rotate`: Batch page rotation.
  - `/api/pdf/flatten`: Form field flattening.
  - `/api/pdf/encrypt`: Password protection & restriction setting.

### B. Native CLI Utilities
- **Decrypt (`/api/pdf/decrypt`)**: Native `qpdf` CLI child process execution with OS temporary file management and cleanup.

### C. In-Memory & Web Standard PDF Utilities (`pdf-lib` & `pdfjs-dist`)
- **Merge (`/api/pdf/merge`)**: Combine multiple PDFs into a single document.
- **Split (`/api/pdf/split`)**: Extract page ranges or split single pages.
- **Metadata Editor (`/api/pdf/metadata`)**: Inspect and update PDF metadata (Title, Author, Subject, Keywords).
- **Watermark & Stamp (`/api/pdf/watermark`, `/api/pdf/stamp`)**: Overlay custom text or image watermarks/stamps.
- **High-Res Image Extraction (`app/lib/pdf/pdfToImageUtils.ts`)**: Render PDF pages into PNG/JPG images.
- **HTML & Markdown to PDF (`/api/pdf/html-to-pdf`, `/api/pdf/markdown-to-pdf`)**: Generate formatted PDFs directly from HTML string or Markdown input.

---

## 5. Testing & Verification

- Unit tests for stores, Zod schemas (`app/lib/schemas/pdfConverterSchema.ts`), and helper utilities.
- Component tests for `ConversionStatus.test.tsx`, `FormatSelector.test.tsx`, and `ToolOptions.test.tsx`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AI Agent Architecture & Development Guide for ConvertIt

Welcome, AI Agent! This guide serves as the definitive reference for understanding, navigating, maintaining, and extending the **ConvertIt** codebase.

---

## 1. Project Overview & Technology Stack

**ConvertIt** is a full-stack, multi-engine document and media conversion platform built for high-throughput synchronous and asynchronous file transformations.

* **Frontend**: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS v4, DaisyUI, Base UI, Lucide Icons
* **Client State**: Zustand 5, TanStack React Query 5
* **Database & ORM**: PostgreSQL (Neon Serverless), Prisma ORM 7 (`@prisma/adapter-neon`)
* **Queue & Background Processing**: Redis (`ioredis`), BullMQ 6, Bun 1.x runtime
* **Conversion Engines**:
  * **Gotenberg API Container**: Microservice for Chromium/LibreOffice conversions & PDFEngines (optimize, rotate, flatten, encrypt).
  * **Native System Tools**: `qpdf` via Node `child_process` execution for encryption/decryption.
  * **Planned Engines**: Sharp (images), FFmpeg (media), Pandoc (markup).

---

## 2. Directory Structure & Key Files

```
convert-it/
├── AGENTS.md                  # Comprehensive AI Agent Guide & rules
├── README.md                  # Project overview & database migration instructions
├── package.json               # Dependency manifest & run scripts
├── prisma.config.ts           # Prisma 7 CLI configuration (loads DIRECT_URL via dotenv)
├── prisma/
│   └── schema.prisma          # Database models (User, Job, File, Conversion, ApiKey, JobStatus)
├── lib/
│   └── utils.ts               # Tailwind class merging utility (clsx + tailwind-merge)
├── app/
│   ├── (public)/              # Main landing page & public routes
│   │   └── page.tsx           # Public homepage layout
│   ├── api/                   # API routes gateway
│   │   └── pdf/               # PDF conversion & manipulation routes
│   │       ├── convert/       # Proxy to Gotenberg (/forms/libreoffice/convert)
│   │       ├── decrypt/       # Native qpdf CLI decryption route
│   │       ├── encrypt/       # Proxy to Gotenberg (/forms/pdfengines/encrypt)
│   │       ├── flatten/       # Proxy to Gotenberg (/forms/pdfengines/flatten)
│   │       ├── optimize/      # Proxy to Gotenberg (/forms/pdfengines/optimize)
│   │       └── rotate/        # Proxy to Gotenberg (/forms/pdfengines/rotate)
│   ├── lib/                   # Shared backend & core service clients
│   │   ├── auth.ts            # Better-auth client setup
│   │   ├── prisma.ts          # Runtime Prisma Client singleton with Neon adapter
│   │   ├── redis.ts           # Shared ioredis Redis connection
│   │   ├── queue.ts           # BullMQ conversion queue producer
│   │   ├── gotenberg/         # Gotenberg API proxy client & error types
│   │   └── schemas/           # Zod validation schemas (pdfConverterSchema.ts)
│   ├── store/                 # Zustand global client stores
│   │   ├── usePDFConversionStore.ts  # PDF operation selection state
│   │   ├── useFileDetectionStore.ts  # Uploaded file type & mime store
│   │   └── useApplicationStore.ts    # Main application settings state
│   ├── utils/                 # Frontend constants & TypeScript definitions
│   │   ├── vars.ts            # Navbar items & PDF_FORMAT_OPTIONS registry
│   │   └── typeDefinitions.ts # Component & state interfaces
│   └── worker/                # Standalone background queue consumer
│       └── index.ts           # BullMQ Worker process (`bun run worker`)
└── components/                # React UI components
    ├── PDFToConvertor.tsx     # Master conversion workspace component
    ├── FileDropzone.tsx       # Drag-and-drop file uploader
    └── pdf-converter/         # Dedicated subcomponents
        ├── FormatSelector.tsx # Category & target format selection grid
        ├── ToolOptions.tsx    # Tool specific options (password, rotation angle, PDF/A version)
        ├── PDFPreview.tsx     # File preview modal/card
        └── ConversionStatus.tsx # Progress state & download trigger
```

---

## 3. Database Architecture & Prisma 7 Conventions

### Dual Connection Architecture
Neon PostgreSQL uses separate endpoints for runtime application queries vs CLI database migrations.

1. **Runtime Application Querying**:
   * Uses `DATABASE_URL` (Pooled Connection).
   * Configured in `app/lib/prisma.ts` using `@prisma/adapter-neon`.
   * Cached on `globalThis` to prevent connection exhaustion during hot module reloads in development.
2. **Prisma CLI & Schema Migrations**:
   * Uses `DIRECT_URL` (Direct, Unpooled Connection).
   * Configured in `prisma.config.ts`.
   * **Note for Agents**: Prisma 7 removed connection URLs from `prisma/schema.prisma`. All connection options live in `prisma.config.ts` or are passed to `PrismaClient({ adapter })`.

### Running Schema Migrations
```bash
# Apply migrations using Bun
bunx prisma migrate dev --name <migration_name>

# Launch Prisma Studio to inspect records
bun run db:studio
```

---

## 4. Frontend Architecture & State Management Flow

### State Management Pattern
* **Zustand Stores** ([app/store/](file:///home/shivam/Desktop/convert-it/app/store/)):
  * `usePDFConversionStore`: Manages the selected PDF tool/conversion operation.
  * `useFileDetectionStore`: Stores file detection results (mime types, file metadata).
  * `useApplicationStore`: Handles UI layout state, theme toggles, and global app settings.

### Tool Registry Pattern ([app/utils/vars.ts](file:///home/shivam/Desktop/convert-it/app/utils/vars.ts))
* Every conversion tool is registered in `PDF_FORMAT_OPTIONS`.
* Each entry contains:
  * `id`: Unique tool key (e.g., `docx`, `compress`, `encrypt`, `decrypt`).
  * `category`: `"document"` | `"tools"`.
  * `endpoint`: API route handling the request (e.g., `/api/pdf/convert?target=/forms/libreoffice/convert`).

### User Flow Journey
1. **File Selection**: User drops a file in `FileDropzone.tsx`.
2. **Option Selection**: User picks a target format in `FormatSelector.tsx` or adjusts options in `ToolOptions.tsx`.
3. **Execution**: `PDFToConvertor.tsx` submits a `FormData` POST request to the corresponding API route defined in `PDF_FORMAT_OPTIONS`.
4. **Response Handling**: The client receives a binary blob response for synchronous conversions (downloading immediately) or a `jobId` for queued background jobs.

---

## 5. Backend Engine & Processing Patterns

### Pattern 1: Gotenberg Synchronous HTTP Proxy
Used for document conversion and PDF engine operations via Gotenberg.
```typescript
// app/lib/gotenberg/client.ts
import { proxyToGotenberg } from "@/app/lib/gotenberg/client";

export async function POST(req: Request) {
  return proxyToGotenberg(req, "/forms/libreoffice/convert");
}
```

### Pattern 2: Native CLI Execution (`qpdf`, `ffmpeg`, `libreoffice`)
Used when native system binaries perform processing.
```typescript
// Always wrap CLI invocations in try/finally blocks and clean up temp disk files
const inputPath = join(tmpdir(), `${id}_input.pdf`);
const outputPath = join(tmpdir(), `${id}_output.pdf`);
try {
  await writeFile(inputPath, inputBuffer);
  await execAsync(`qpdf --decrypt --password='${pass}' '${inputPath}' '${outputPath}'`, {
    env: { ...process.env, PATH: "/usr/local/bin:/usr/bin:/bin" }
  });
  const result = await readFile(outputPath);
  return new Response(result, { headers: { "Content-Type": "application/pdf" } });
} finally {
  unlink(inputPath).catch(() => {});
  unlink(outputPath).catch(() => {});
}
```

### Pattern 3: Asynchronous BullMQ Queue & Worker
Used for long-running, multi-page, or high-CPU conversion jobs.
* Producer (`app/lib/queue.ts`): API routes call `conversionQueue.add("process-pdf", payload)`.
* Worker (`app/worker/index.ts`): Standalone process listening for jobs, executing conversions, and updating the database job status via Prisma.

---

## 6. How to Run & Develop

The project runs as two independent long-lived processes:

```bash
# Terminal 1: Web Application (Next.js Dev Server)
bun run dev

# Terminal 2: Queue Worker (BullMQ Consumer)
bun run worker
```

---

## 7. Guidelines for AI Agents Modifying Code

1. **Preserve Prisma 7 Adapter Setup**: Do not put `url` or `directUrl` back into `prisma/schema.prisma`. Keep connection logic in `prisma.config.ts` and `app/lib/prisma.ts`.
2. **Always Clean Up Temp Files**: When using native CLI utilities (`child_process`), write temporary files to OS `tmpdir()` and clean up all input/output files in a `finally` block using `unlink(...).catch(() => {})`.
3. **Register New Tools in `vars.ts`**: When adding a new format or tool, register its metadata in `PDF_FORMAT_OPTIONS` inside `app/utils/vars.ts` before creating UI controls.
4. **Environment Variables**: Always ensure `PATH` environment settings are explicitly passed when spawning child processes in Node.js server routes.
5. **Error Handlers**: Return standard JSON or Response streams with accurate HTTP status codes (400 for bad input/incorrect password, 502 for upstream Gotenberg error, 500 for internal engine failures).

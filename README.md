# ConvertIt

## Application Architecture

### 1. Frontend

The frontend is built with Next.js and includes the following user-facing sections:

- Landing Page
- All Tools
- Upload & Convert
- Dashboard
- Job History
- Downloads
- Account Settings
- Authentication

### 2. Backend

The backend is exposed through Next.js API routes and server actions, with the following modules:

- Auth API
- Upload API
- Conversion API
- Job API
- Download API
- User API
- Admin API

### 3. Data Layer

The main application data is stored in PostgreSQL (Neon / Supabase) and organized around:

- Users
- Jobs
- Files
- Conversions
- Settings
- API Keys

### 4. Queue

Asynchronous job orchestration is handled using:

- Redis
- BullMQ
- Conversion Queue
- Retry / Failed Job Queue

### 5. Worker Layer

Background processing workers handle conversion tasks across multiple formats:

- Image Engine
- PDF Engine
- Document Engine
- Media Engine
- Developer Tools

These workers perform operations such as:

- Resize
- Compress
- Crop
- Merge
- Split
- Rotate
- Watermark
- Format conversion

### 6. Storage

Processed and temporary files are stored in Cloudflare R2 / AWS S3-compatible object storage:

- uploads/original files
- temp files
- converted files

### 7. Output & Delivery

After conversion jobs complete, the platform:

- Generates a secure download link
- Lets the user download the file
- Automatically deletes files after a retention period

### 8. Observability & Operations

Operational monitoring and reliability features include:

- Logging (Pino)
- Monitoring (Sentry)
- Analytics (PostHog)
- Rate limiting
- Email alerts / resend notifications

## Tech Stack

- Next.js
- PostgreSQL
- Redis + BullMQ
- Cloudflare R2 / S3 storage
- Sharp / FFmpeg / pdf-lib / LibreOffice / others
- Pino, Sentry, PostHog

---

## Database Setup & Migrations

The data layer uses **PostgreSQL (Neon)** with **Prisma ORM (v7)** as the schema/migration tool and the **`@prisma/adapter-neon`** driver adapter at runtime.

### Prerequisites

- A Neon project created at [console.neon.tech](https://console.neon.tech)
- Both a **pooled** and a **direct (unpooled)** connection string from the Neon dashboard (`Connect` button on the Project Dashboard, toggle **Connection pooling** on/off to switch between them)
  - Pooled hostname contains `-pooler`
  - Direct hostname does not

### Environment variables

Stored in `.env` at the project root:

```env
# Pooled connection — used by the app at runtime
DATABASE_URL="postgresql://user:pass@ep-xxxx-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Direct connection — used by Prisma CLI for migrations
DIRECT_URL="postgresql://user:pass@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### Migration stages

1. **Install dependencies**

   ```bash
   bun add zod @prisma/client @prisma/adapter-neon
   bun add -d prisma dotenv
   ```

2. **Initialize Prisma**

   ```bash
   bunx prisma init
   ```

   Generates `prisma/schema.prisma` and a starter env file.

3. **Define the schema** (`prisma/schema.prisma`)
   - `provider = "postgresql"` in the `datasource` block
   - No `url` / `directUrl` set here — Prisma 7 moved connection config out of the schema file entirely
   - Models: `User`, `Job`, `File`, `Conversion`, `ApiKey`, plus a `JobStatus` enum

4. **Configure `prisma.config.ts`**
   - Loads env vars explicitly via `dotenv` (required since the project uses `.env`, and the CLI does not auto-load it like Next.js does)
   - Sets `datasource.url` to the **direct** URL (`DIRECT_URL`), since migrations require a non-pooled connection

   ```typescript
   import { config } from "dotenv";
   config({ path: ".env" });

   import { defineConfig, env } from "prisma/config";

   export default defineConfig({
     schema: "prisma/schema.prisma",
     migrations: {
       path: "prisma/migrations",
     },
     datasource: {
       url: env("DIRECT_URL"),
     },
   });
   ```

5. **Run the initial migration**

   ```bash
   bunx prisma migrate dev --name init
   ```

   Creates the tables in Neon and generates the Prisma Client.

6. **Wire up the runtime client with the Neon adapter** (`lib/prisma.ts`)
   - Uses the **pooled** URL (`DATABASE_URL`) via `@prisma/adapter-neon`
   - Cached as a global singleton to avoid exhausting Neon's connection limit during Next.js hot-reload in dev

   ```typescript
   import { PrismaClient } from "@prisma/client";
   import { PrismaNeon } from "@prisma/adapter-neon";

   const adapter = new PrismaNeon({
     connectionString: process.env.DATABASE_URL,
   });

   const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

   export const prisma =
     globalForPrisma.prisma ?? new PrismaClient({ adapter });

   if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
   ```

7. **(Optional) Inspect data**
   ```bash
   bunx prisma studio
   ```

### Notes / gotchas

- **Pooled vs. direct**: the app uses the pooled connection (`DATABASE_URL`) for normal queries; the Prisma CLI uses the direct connection (`DIRECT_URL`) for migrations. Mixing these up causes connection errors under load or migration failures.
- **Prisma 7 breaking change**: `url` / `directUrl` can no longer live in `schema.prisma`. Connection config now lives in `prisma.config.ts` (for the CLI) and is passed via a driver adapter (for the runtime client).
- **`.env` loading**: Next.js auto-loads `.env` / `.env.local` for the app itself, but the standalone Prisma CLI does not — hence the explicit `dotenv.config({ path: ".env" })` call in `prisma.config.ts`.

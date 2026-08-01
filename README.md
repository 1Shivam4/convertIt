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

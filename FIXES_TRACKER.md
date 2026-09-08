# ConvertIt — Pre-Backend Fix Tracker
> Goal: Complete all 5 core fixes before moving to user management, auth & multi-tenancy phase.
> Last updated: 2026-09-09

---

## Progress Overview

| # | Fix | Status | Est. |
|---|---|---|---|
| 1 | Dedicated `/tools/convert-pdf` page | `[x] DONE` | 45 min |
| 2 | Multi-file drop in homepage `FileDropzone` | `[x] DONE` | 30 min |
| 3 | Office file routing (DOCX, XLSX, PPTX → PDF workspace) | `[x] DONE` | 1 hr |
| 4 | Register missing PDF tools (watermark, stamp, html-to-pdf, md-to-pdf) | `[x] DONE` | 1.5 hr |
| 5 | Unify `MediaToConvertor` dual file state | `[x] DONE` | 45 min |

---

## Fix #1 — Dedicated `/tools/convert-pdf` Page

**Status**: `[x] DONE`

**Why**: PDF is the only engine without a standalone page. Navbar links all 404.

**Files**:
- [ ] `app/(public)/tools/convert-pdf/page.tsx` — [NEW] server component page shell with hero + metadata
- [ ] `components/PDFConverterWorkspace.tsx` — [NEW] client wrapper with self-contained PDF dropzone
- [ ] `app/utils/vars.ts` — update navbar PDF tool links to point to `/tools/convert-pdf`

---

## Fix #2 — Multi-File Drop in Homepage `FileDropzone`

**Status**: `[x] DONE`

**Why**: Only first dropped file is picked up. PDF merge needs multi-file initial drop.

**Files**:
- [ ] `components/FileDropzone.tsx` — support multi-file drop when all files are PDFs
  - [ ] Replace `files?.[0]` with `Array.from(e.dataTransfer.files)`
  - [ ] Add `allPDFs` branch → call `addFiles()` + `setSourceType()` directly
  - [ ] Update `handleFileChange` to allow `multiple` selection
  - [ ] Add `multiple` attribute to the hidden `<input>`

---

## Fix #3 — Office File Routing in `FileDropzone`

**Status**: `[x] DONE`

**Why**: DOCX/XLSX/PPTX dropped on homepage silently renders nothing. Gotenberg already handles them.

**Files**:
- [ ] `components/FileDropzone.tsx` — add `isOfficeDoc` branch that routes to `<PDFToConvertor />`
  - [ ] Define `OFFICE_EXTENSIONS` and `OFFICE_MIME_TYPES` constants
  - [ ] Add routing branch after `isMedia` check
- [ ] `components/pdf-converter/PDFPreview.tsx` — guard against non-PDF files
  - [ ] If `file.type !== "application/pdf"`, render a generic file card instead of canvas preview

---

## Fix #4 — Register Missing PDF Tools

**Status**: `[x] DONE`

**Why**: `/api/pdf/watermark`, `/api/pdf/stamp`, `/api/pdf/html-to-pdf`, `/api/pdf/markdown-to-pdf` exist but are inaccessible from UI.

**Files**:
- [ ] `app/utils/vars.ts`
  - [ ] Add `watermark` entry to `PDF_FORMAT_OPTIONS`
  - [ ] Add `stamp` entry to `PDF_FORMAT_OPTIONS`
  - [ ] Add `html-to-pdf` entry to `PDF_FORMAT_OPTIONS`
  - [ ] Add `markdown-to-pdf` entry to `PDF_FORMAT_OPTIONS`
  - [ ] Update `iconName` union type if new icons needed
- [ ] `app/lib/schemas/pdfConverterSchema.ts`
  - [ ] Add optional fields: `watermarkText`, `stampText`, `htmlContent`, `markdownContent`
- [ ] `components/pdf-converter/ToolOptions.tsx`
  - [ ] Add panel for `watermark` (text input)
  - [ ] Add panel for `stamp` (text input)
  - [ ] Add panel for `html-to-pdf` (textarea for HTML)
  - [ ] Add panel for `markdown-to-pdf` (textarea for Markdown)
- [ ] `components/PDFToConvertor.tsx` — onSubmit
  - [ ] Append tool-specific fields to formData per operation
  - [ ] Handle optional file for `html-to-pdf` and `markdown-to-pdf`

---

## Fix #5 — Unify `MediaToConvertor` File State

**Status**: `[x] DONE`

**Why**: Dual file state (`localFile` + `storeFile`) is fragile and can cause stale state bugs.

**Files**:
- [ ] `components/MediaToConvertor.tsx`
  - [ ] Remove `localFile` useState
  - [ ] Remove `handleFileSelect` local handler
  - [ ] Use `file` and `reset` from `useConverterStore()` as single source of truth
  - [ ] Pass `setFile` from store as `onFileSelect` to `MediaDropzone`
- [ ] `components/media-converter/MediaDropzone.tsx`
  - [ ] Ensure `onFileSelect` prop calls the store's `setFile` (passed from parent)
- [ ] `components/media-converter/MediaConvertButton.tsx`
  - [ ] Verify `file` prop is sourced from global store (no change likely needed)

---

## Completion Gate

All 5 fixes done → project ready for **Phase 2: Backend Integration**
- User management (Better Auth UI flows)
- Dashboard & job history pages
- Multi-tenancy architecture
- Rate limiting (`@upstash/ratelimit`)
- Cloud object storage (S3/R2)

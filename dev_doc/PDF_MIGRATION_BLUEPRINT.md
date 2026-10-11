# PDF Architecture Inventory & Migration Blueprint

> **Status**: Paused / Ready for Future Execution  
> **Target Route**: `/pdf`  
> **Source Redundancies**: `/tools/pdf`, `/tools/convert-pdf`

---

## 1. Existing Inventory

### Pages & Routing
* `app/(public)/tools/pdf/page.tsx`: Renders `<PDFStudio />`.
* `app/(public)/tools/convert-pdf/page.tsx`: Redundant duplicate rendering `<PDFConverterWorkspace />`.
* `next.config.ts`: Currently redirects `/tools/convert-pdf` → `/tools/pdf`.

### Components
* `components/PDFToConvertor.tsx`: Master conversion workspace (React Hook Form, Zod, Gotenberg/qpdf/pdf-lib integration).
* `components/PDFConverterWorkspace.tsx`: Drag-and-drop landing area with quick format cards, handing off to `PDFToConvertor`.
* `components/studios/PDFStudio.tsx`: Wrapper returning `<PDFConverterWorkspace />`.
* `components/pdf-converter/`:
  * `ConversionStatus.tsx`: Progress animation, download actions, error display.
  * `FormatSelector.tsx`: Grid of target formats (DOCX, XLSX, PPTX, PNG, JPG, HTML, TXT, CSV, MD, PDF/A, Tools).
  * `ToolOptions.tsx`: Password inputs (encrypt/decrypt), rotation angle (90°/180°/270°), PDF/A standard selector, watermark text/opacity.
  * `PDFPreview.tsx`: PDF rendering canvas / thumbnail cards.
  * `PDFPageGrid.tsx`: Visual per-page thumbnail reordering, per-page rotation, and deletion.
  * `PDFFileList.tsx`: Multi-document manager for merge operations.

### State & Validation
* `app/store/usePDFConversionStore.ts`: PDF tool selection state.
* `app/store/useFileDetectionStore.ts`: Uploaded file stage machine (`idle` → `ready` → `converting` → `completed` → `error`).
* `app/lib/schemas/pdfConverterSchema.ts`: Zod schema for format selection, angles, passwords, and PDF/A versions.

### Backend Endpoints (`/api/pdf/`)
* `/api/pdf/convert`: Gotenberg LibreOffice proxy for PDF ↔ Office formats & markup.
* `/api/pdf/optimize`: Gotenberg PDFEngine compression/optimization.
* `/api/pdf/rotate`: Page rotation via Gotenberg / `pdf-lib`.
* `/api/pdf/split`: Page extraction into ZIP via `pdf-lib`.
* `/api/pdf/merge`: Multi-document joining via `pdf-lib`.
* `/api/pdf/encrypt`: Gotenberg PDFEngine password protection.
* `/api/pdf/decrypt`: Native CLI `qpdf --decrypt` execution with auto temp cleanup.
* `/api/pdf/flatten`: PDFEngine form & annotation flattening.
* `/api/pdf/watermark`: Text & opacity diagonal watermarking.
* `/api/pdf/stamp`: Overlay stamp PDF.
* `/api/pdf/html-to-pdf`: Chromium headless rendering.
* `/api/pdf/markdown-to-pdf`: Markdown to PDF conversion.
* `/api/pdf/metadata`: Page count & info extraction.

### Core Libraries
* `app/lib/gotenberg/client.ts`, `errors.ts`, `types.ts`: Gotenberg API client.
* `app/lib/pdf/pdfLibUtils.ts`: In-memory `pdf-lib` routines (rotate, delete, extract, merge).
* `app/lib/pdf/pdfToImageUtils.ts`: PDF page rendering into JPG/PNG.

---

## 2. Migration Execution Steps (When Resuming)

1. **Create `/pdf` route**:
   * Create `app/(public)/pdf/page.tsx` rendering `<PDFStudio />` or the unified workspace.
2. **Remove Deprecated Routes**:
   * Delete `app/(public)/tools/pdf/page.tsx`.
   * Delete `app/(public)/tools/convert-pdf/page.tsx`.
3. **Configure Redirects in `next.config.ts`**:
   * Redirect `/tools/pdf` → `/pdf`.
   * Redirect `/tools/convert-pdf` → `/pdf`.
4. **Update Navigation Links**:
   * `app/utils/vars.ts`: Point PDF navbar items to `/pdf?tool=...`.
   * `components/NavItems.tsx`: Update active route match to `/pdf`.
   * `components/SupportConversions.tsx`: Link PDF card directly to `/pdf`.
   * `components/FileDropzone.tsx`: Auto-detect router push to `/pdf`.

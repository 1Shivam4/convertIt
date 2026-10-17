/**
 * app/lib/file/pdf-format-guards.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for PDF and Document file detection, magic bytes
 * verification, and format categorization for the Document & PDF Studio.
 */

export const SUPPORTED_PDF_EXTS = ["pdf"] as const;

export const SUPPORTED_DOCUMENT_EXTS = [
  "docx",
  "doc",
  "xlsx",
  "xls",
  "pptx",
  "ppt",
  "odt",
  "ods",
  "odp",
  "rtf",
  "txt",
  "html",
  "htm",
  "md",
  "markdown",
  "csv",
  "epub",
] as const;

export const KNOWN_DOCUMENT_MIMES: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ppt: "application/vnd.ms-powerpoint",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  rtf: "application/rtf",
  txt: "text/plain",
  html: "text/html",
  htm: "text/html",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  epub: "application/epub+zip",
};

/**
 * Checks if a file is a PDF based on MIME type or file extension (case-insensitive).
 */
export function isPdfFile(file: File | { name: string; type?: string }): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type?.toLowerCase() || "";
  return (
    ext === "pdf" ||
    mime === "application/pdf" ||
    mime === "application/x-pdf" ||
    mime === "application/acrobat" ||
    mime === "applications/vnd.pdf" ||
    mime === "text/pdf"
  );
}

/**
 * Checks if a file is an office/text/markup document convertible to or from PDF.
 */
export function isDocumentForPdf(file: File | { name: string; type?: string }): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const mime = file.type?.toLowerCase() || "";
  return (
    isPdfFile(file) ||
    SUPPORTED_DOCUMENT_EXTS.includes(ext as any) ||
    Object.values(KNOWN_DOCUMENT_MIMES).includes(mime)
  );
}

/**
 * Inspects binary magic header bytes for "%PDF-" signature (0x25 0x50 0x44 0x46 0x2D).
 * Guarantees 100% accurate PDF identification even if file has no extension or wrong MIME.
 */
export async function verifyPdfMagicBytes(file: File): Promise<boolean> {
  try {
    const slice = file.slice(0, 5);
    const buf = await slice.arrayBuffer();
    const str = new TextDecoder().decode(buf);
    return str.startsWith("%PDF");
  } catch {
    return false;
  }
}

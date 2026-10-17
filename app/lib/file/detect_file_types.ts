import { fileTypeFromBlob } from "file-type";
import { DetectedFileType } from "@/app/utils/typeDefinitions";
import {
  isPdfFile,
  verifyPdfMagicBytes,
  KNOWN_DOCUMENT_MIMES,
} from "./pdf-format-guards";

export async function detectFileType(
  file: File,
): Promise<DetectedFileType | null> {
  // 1. Direct PDF check (Extension or MIME)
  if (isPdfFile(file)) {
    return {
      extension: "pdf",
      mimeType: "application/pdf",
    };
  }

  // 2. Binary Magic Header check for "%PDF-" signature
  const isMagicPdf = await verifyPdfMagicBytes(file);
  if (isMagicPdf) {
    return {
      extension: "pdf",
      mimeType: "application/pdf",
    };
  }

  // 3. Binary magic inspection via file-type library
  try {
    const result = await fileTypeFromBlob(file);
    if (result) {
      return {
        extension: result.ext,
        mimeType: result.mime,
      };
    }
  } catch (err) {
    console.warn("[FileDetection] fileTypeFromBlob error, proceeding to extension fallback:", err);
  }

  // 4. Fallback for office documents, markup, and text files that lack magic headers
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext) {
    const matchedMime = KNOWN_DOCUMENT_MIMES[ext] || file.type || "application/octet-stream";
    return {
      extension: ext,
      mimeType: matchedMime,
    };
  }

  // 5. Fallback if file has type but no extension
  if (file.type && file.type !== "application/octet-stream") {
    const subType = file.type.split("/")[1] || "bin";
    return {
      extension: subType,
      mimeType: file.type,
    };
  }

  return null;
}

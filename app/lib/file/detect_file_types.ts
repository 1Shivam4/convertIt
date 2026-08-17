import { fileTypeFromBlob } from "file-type";
import { DetectedFileType } from "@/app/utils/typeDefinitions";

export async function detectFileType(
  file: File,
): Promise<DetectedFileType | null> {
  const result = await fileTypeFromBlob(file);

  if (!result) {
    return null;
  }

  return {
    extension: result.ext,
    mimeType: result.mime,
  };
}

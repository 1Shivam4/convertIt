import { NextRequest } from "next/server";
import {
  processImageTransform,
  ImageTransformOptions,
} from "@/app/lib/image/sharpUtils";
import { recordUserJob } from "@/app/lib/auth-helpers";
import {
  guardFileSizeBatch,
  fileSizeErrorResponse,
} from "@/app/lib/file-guard";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const optionsRaw = formData.get("options") as string | null;

    if (!files || files.length === 0) {
      return new Response("No image files uploaded.", { status: 400 });
    }

    // ── Plan-based file size enforcement ─────────────────────────────────────
    const guard = guardFileSizeBatch(req, files);
    if (!guard.allowed) return fileSizeErrorResponse(guard);

    let parsedOptions: ImageTransformOptions = { targetFormat: "jpg" };
    if (optionsRaw) {
      try {
        parsedOptions = JSON.parse(optionsRaw);
      } catch {
        // Fallback to defaults
      }
    }

    // If single file upload, return the converted file directly
    if (files.length === 1) {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await processImageTransform(buffer, parsedOptions);

      const originalName =
        file.name.substring(0, file.name.lastIndexOf(".")) || "converted";
      const downloadFilename = `${originalName}${result.extension}`;

      // Log conversion job if user is authenticated (session or API key)
      const srcExt = file.name.split(".").pop()?.toLowerCase() || "img";
      recordUserJob(req, {
        sourceFormat: srcExt,
        targetFormat: parsedOptions.targetFormat,
        engine: "sharp",
        status: "COMPLETED",
        fileSize: result.buffer.byteLength,
      });

      return new Response(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename="${downloadFilename}"`,
          "Content-Length": String(result.buffer.byteLength),
          "X-Converted-Size": String(result.buffer.byteLength),
          "X-Original-Size": String(buffer.byteLength),
        },
      });
    }

    // If multiple files upload, bundle them into a ZIP archive
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await processImageTransform(buffer, parsedOptions);
      const originalName =
        file.name.substring(0, file.name.lastIndexOf(".")) || `image_${i + 1}`;
      zip.file(`${originalName}${result.extension}`, result.buffer);
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    recordUserJob(req, {
      sourceFormat: "batch",
      targetFormat: parsedOptions.targetFormat,
      engine: "sharp",
      status: "COMPLETED",
      fileSize: zipContent.byteLength,
    });

    return new Response(new Uint8Array(zipContent), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="converted_images.zip"`,
        "Content-Length": String(zipContent.byteLength),
      },
    });
  } catch (err: any) {
    console.error("Image conversion error:", err);
    return new Response(`Failed to convert image: ${err?.message || err}`, {
      status: 500,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  processImageTransform,
  ImageTransformOptions,
} from "@/app/lib/image/sharpUtils";
import { recordUserJob } from "@/app/lib/auth-helpers";
import {
  guardFileSizeBatch,
  fileSizeErrorResponse,
} from "@/app/lib/file-guard";
import { consumeEngineQuota, getClientIdentifier } from "@/app/lib/engine-quota";
import { shouldOffloadToWorker } from "@/app/lib/adaptiveRouter";
import { enqueueConversionJob } from "@/app/lib/queue";
import { resolveUserFromRequest } from "@/app/lib/resolve-plan";
import type { Plan } from "@/app/lib/plans";
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

    // ── Plan-based daily image quota check ───────────────────────────────────
    const plan = (req.headers.get("x-user-plan") as Plan) || "GUEST";
    const clientId = getClientIdentifier(req);
    const quota = await consumeEngineQuota(clientId, "image", plan, files.length);

    if (!quota.allowed) {
      return new Response(
        JSON.stringify({
          error: quota.message || "Daily image conversion quota exceeded.",
          quota,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(quota.resetSeconds),
          },
        }
      );
    }

    let parsedOptions: ImageTransformOptions = { targetFormat: "jpg" };
    if (optionsRaw) {
      try {
        parsedOptions = JSON.parse(optionsRaw);
      } catch {
        // Fallback to defaults
      }
    }

    // Check total payload size or single file size for adaptive offloading
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const isBatchHeavy = files.length > 5;

    if (shouldOffloadToWorker(totalBytes, parsedOptions.targetFormat, { isBatch: isBatchHeavy })) {
      const user = await resolveUserFromRequest(req);
      const firstFile = files[0];
      const buffer = Buffer.from(await firstFile.arrayBuffer());

      const { jobId } = await enqueueConversionJob({
        userId: user?.id || null,
        sourceFormat: firstFile.name.split(".").pop() || "img",
        targetFormat: parsedOptions.targetFormat,
        engine: "sharp",
        fileName: firstFile.name,
        fileSize: totalBytes,
        fileBuffer: buffer,
        options: parsedOptions,
      });

      return NextResponse.json(
        {
          mode: "async",
          jobId,
          status: "QUEUED",
          message: "High-resolution image conversion queued for background processing",
        },
        { status: 202 }
      );
    }

    // If single file upload, return the converted file directly (Fast-Path)
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

import { NextRequest, NextResponse } from "next/server";
import { proxyToGotenberg } from "../../../lib/gotenberg/client";
import { guardFileSize, fileSizeErrorResponse } from "@/app/lib/file-guard";
import { shouldOffloadToWorker } from "@/app/lib/adaptiveRouter";
import { enqueueConversionJob } from "@/app/lib/queue";
import { resolveUserFromRequest } from "@/app/lib/resolve-plan";

const DEFAULT_PATH = "/convert";

export async function POST(req: NextRequest) {
  // Clone request to read file details and check size
  const cloned = req.clone();
  try {
    const formData = await cloned.formData();
    const files = formData.getAll("files") as File[];
    const file = files[0] ?? (formData.get("file") as File | null);
    const target = req.nextUrl.searchParams.get("target") || DEFAULT_PATH;
    const formatId = req.nextUrl.searchParams.get("format") || "pdf";

    if (file) {
      const guard = guardFileSize(req, file.size);
      if (!guard.allowed) return fileSizeErrorResponse(guard);

      const forceAsync = req.nextUrl.searchParams.get("forceAsync") === "true";

      // Adaptive Routing or user-forced BullMQ queue offload
      if (forceAsync || shouldOffloadToWorker(file.size, formatId)) {
        const user = await resolveUserFromRequest(req);
        const arrayBuf = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuf);

        const { jobId } = await enqueueConversionJob({
          userId: user?.id || null,
          sourceFormat: file.name.split(".").pop() || "pdf",
          targetFormat: formatId,
          engine: "gotenberg",
          fileName: file.name,
          fileSize: file.size,
          fileBuffer,
          options: { targetPath: target },
        });

        return NextResponse.json(
          {
            mode: "async",
            jobId,
            status: "QUEUED",
            message: "Conversion queued for background processing",
          },
          { status: 202 }
        );
      }
    }
  } catch {
    /* ignore parse errors — fallback to synchronous proxy */
  }

  const target = req.nextUrl.searchParams.get("target") || DEFAULT_PATH;
  return proxyToGotenberg(req, target);
}

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("target") || DEFAULT_PATH;
  return proxyToGotenberg(req, target);
}

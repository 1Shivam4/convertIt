import { NextRequest } from "next/server";
import { proxyToGotenberg } from "../../../lib/gotenberg/client";
import { guardFileSize, fileSizeErrorResponse } from "@/app/lib/file-guard";

const DEFAULT_PATH = "/convert";

export async function POST(req: NextRequest) {
  // Clone request to read file size without consuming the body
  const cloned = req.clone();
  try {
    const formData = await cloned.formData();
    const files = formData.getAll("files") as File[];
    const file = files[0] ?? (formData.get("file") as File | null);
    if (file) {
      const guard = guardFileSize(req, file.size);
      if (!guard.allowed) return fileSizeErrorResponse(guard);
    }
  } catch { /* ignore parse errors — let Gotenberg handle */ }

  return proxyToGotenberg(req, DEFAULT_PATH);
}

export async function GET(req: Request) {
  return proxyToGotenberg(req, DEFAULT_PATH);
}

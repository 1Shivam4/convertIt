import { NextRequest } from "next/server";
import sharp from "sharp";
import { recordUserJob } from "@/app/lib/auth-helpers";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("files") as File | null;
    const cropRaw = formData.get("crop") as string | null;

    if (!file) return new Response("No image file uploaded.", { status: 400 });
    if (!cropRaw)
      return new Response("No crop region provided.", { status: 400 });

    const { left, top, width, height } = JSON.parse(cropRaw) as {
      left: number;
      top: number;
      width: number;
      height: number;
    };

    if (width <= 0 || height <= 0) {
      return new Response("Invalid crop dimensions.", { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // Get original image metadata to clamp crop region within bounds
    const meta = await sharp(inputBuffer).metadata();
    const imgW = meta.width ?? 0;
    const imgH = meta.height ?? 0;

    const safeLeft = Math.max(0, Math.round(left));
    const safeTop = Math.max(0, Math.round(top));
    const safeWidth = Math.min(Math.round(width), imgW - safeLeft);
    const safeHeight = Math.min(Math.round(height), imgH - safeTop);

    const outputBuffer = await sharp(inputBuffer)
      .extract({
        left: safeLeft,
        top: safeTop,
        width: safeWidth,
        height: safeHeight,
      })
      .toBuffer();

    const originalName =
      file.name.substring(0, file.name.lastIndexOf(".")) || "cropped";
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";

    recordUserJob(req, {
      sourceFormat: ext,
      targetFormat: ext,
      engine: "sharp",
      status: "COMPLETED",
      fileSize: outputBuffer.byteLength,
    });

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": file.type || "image/jpeg",
        "Content-Disposition": `attachment; filename="${originalName}_cropped.${ext}"`,
        "Content-Length": String(outputBuffer.byteLength),
        "X-Converted-Size": String(outputBuffer.byteLength),
        "X-Original-Size": String(inputBuffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error("Image crop error:", err);
    return new Response(`Failed to crop image: ${err?.message || err}`, {
      status: 500,
    });
  }
}

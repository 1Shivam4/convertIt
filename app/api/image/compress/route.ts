import { NextRequest } from "next/server";
import { processImageTransform } from "@/app/lib/image/sharpUtils";
import JSZip from "jszip";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const qualityRaw = formData.get("quality") as string | null;
    const quality = qualityRaw ? parseInt(qualityRaw, 10) : 75;

    if (!files || files.length === 0) {
      return new Response("No image files uploaded.", { status: 400 });
    }

    if (files.length === 1) {
      const file = files[0];
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const targetFormat = ["png", "webp", "avif", "gif"].includes(ext) ? ext : "jpg";

      const result = await processImageTransform(buffer, {
        targetFormat,
        quality,
        stripExif: true,
      });

      const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || "compressed";

      return new Response(new Uint8Array(result.buffer), {
        status: 200,
        headers: {
          "Content-Type": result.contentType,
          "Content-Disposition": `attachment; filename="${originalName}_compressed${result.extension}"`,
          "Content-Length": String(result.buffer.byteLength),
          "X-Converted-Size": String(result.buffer.byteLength),
          "X-Original-Size": String(buffer.byteLength),
        },
      });
    }

    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const targetFormat = ["png", "webp", "avif", "gif"].includes(ext) ? ext : "jpg";

      const result = await processImageTransform(buffer, {
        targetFormat,
        quality,
        stripExif: true,
      });

      const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || `image_${i + 1}`;
      zip.file(`${originalName}_compressed${result.extension}`, result.buffer);
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(new Uint8Array(zipContent), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="compressed_images.zip"`,
        "Content-Length": String(zipContent.byteLength),
      },
    });
  } catch (err: any) {
    console.error("Image compress error:", err);
    return new Response(`Failed to compress image: ${err?.message || err}`, {
      status: 500,
    });
  }
}

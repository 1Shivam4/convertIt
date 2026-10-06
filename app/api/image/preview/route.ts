import { NextRequest, NextResponse } from "next/server";
import convertHeic from "heic-convert";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Decode HEIC/HEIF into PNG/JPEG
    const decodedBuffer = await convertHeic({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.8,
    });

    // Resize into optimized preview thumbnail for browser rendering
    const thumbnail = await sharp(Buffer.from(decodedBuffer))
      .rotate()
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(thumbnail).metadata();

    return new Response(thumbnail as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "X-Image-Width": String(metadata.width || 0),
        "X-Image-Height": String(metadata.height || 0),
      },
    });
  } catch (error: any) {
    console.error("HEIC preview generation failed:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate HEIC preview" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

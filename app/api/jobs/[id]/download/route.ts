import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getObjectBufferFromR2 } from "@/app/lib/s3";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!job || job.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Job not found or conversion not completed" },
        { status: 404 }
      );
    }

    const outputFile = job.files.find((f) => f.path.startsWith("outputs/"));
    if (!outputFile) {
      return NextResponse.json(
        { error: "Output file record not found" },
        { status: 404 }
      );
    }

    const buffer = await getObjectBufferFromR2(outputFile.path);

    const filename = `converted_${id}.${job.targetFormat}`;
    return new Response(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": outputFile.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error("[JobDownload API] Error:", err);
    return NextResponse.json(
      { error: "Failed to download converted artifact" },
      { status: 500 }
    );
  }
}

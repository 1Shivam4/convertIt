import { NextRequest } from "next/server";
import { generateIcoFavicon } from "@/app/lib/image/sharpUtils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("files") as File | null;

    if (!file) {
      return new Response("No image file provided for favicon creation.", {
        status: 400,
      });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await generateIcoFavicon(buffer);

    const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || "favicon";

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${originalName}.ico"`,
        "Content-Length": String(result.buffer.byteLength),
      },
    });
  } catch (err: any) {
    console.error("Favicon generation error:", err);
    return new Response(`Failed to generate favicon: ${err?.message || err}`, {
      status: 500,
    });
  }
}

import { NextResponse } from "next/server";
import { convertMediaWithProgress, FFmpegOptions } from "@/app/lib/media/ffmpegUtils";
import { mediaConverterSchema } from "@/app/lib/schemas/mediaConverterSchema";
import { MEDIA_FORMAT_OPTIONS } from "@/app/utils/vars";
import { existsSync } from "fs";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";

const execFileAsync = promisify(execFile);

const GIF_MAX_DURATION_S = 15;

async function probeDurationSeconds(buffer: Buffer): Promise<number | null> {
  try {
    const ffmpegStatic = (await import("ffmpeg-static")).default as string | null;
    const localStaticPath = join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
    const ffmpegBin = existsSync(localStaticPath)
      ? localStaticPath
      : (ffmpegStatic && existsSync(ffmpegStatic) ? ffmpegStatic : "/usr/local/bin/ffmpeg");

    const probePath = join(tmpdir(), `convertit_probe_${Date.now()}`);
    await writeFile(probePath, buffer);
    try {
      const { stderr } = await execFileAsync(ffmpegBin, ["-i", probePath], {
        timeout: 10000,
        env: { ...process.env, PATH: `${process.env.PATH || ""}:/usr/local/bin:/usr/bin:/bin` },
      }).catch((e: any) => ({ stderr: (e.stderr as string) ?? "" })) as any;
      const m = (stderr as string).match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
      if (m) return parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
    } finally {
      unlink(probePath).catch(() => {});
    }
  } catch { /* ignore probe errors */ }
  return null;
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  const sendEvent = (
    controller: ReadableStreamDefaultController,
    data: object
  ) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const optionsJson = formData.get("options") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No media file uploaded" }, { status: 400 });
  }

  let parsedOptions: FFmpegOptions = { selectedFormatId: "mp4", resolution: "original" };
  if (optionsJson) {
    try {
      const raw = JSON.parse(optionsJson);
      const result = mediaConverterSchema.safeParse(raw);
      if (result.success) parsedOptions = result.data as FFmpegOptions;
    } catch { /* ignore */ }
  }

  const arrayBuffer = await file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);

  const targetFormat = MEDIA_FORMAT_OPTIONS.find(
    (f) => f.id.toLowerCase() === parsedOptions.selectedFormatId.toLowerCase()
  );
  const mimeType = targetFormat?.mimeType ?? "application/octet-stream";
  const extension = targetFormat?.extension ?? `.${parsedOptions.selectedFormatId}`;
  const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
  const downloadFileName = `${baseName}_converted${extension}`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ── GIF duration guard ────────────────────────────────────────────
        const isGif = parsedOptions.selectedFormatId.toLowerCase() === "gif";
        const isVideo = file.type.startsWith("video/") ||
          /\.(mp4|webm|mov|avi|mkv|m4v|wmv|flv)$/i.test(file.name);

        if (isGif && isVideo) {
          sendEvent(controller, { type: "progress", percent: 5, fps: "—", speed: "—", stage: "Checking duration…" });
          const dur = await probeDurationSeconds(inputBuffer);
          if (dur !== null && dur > GIF_MAX_DURATION_S) {
            sendEvent(controller, {
              type: "error",
              message: `GIF is limited to clips ≤ ${GIF_MAX_DURATION_S}s. Your video is ${Math.round(dur)}s. Use the Trim fields to select a short segment, or choose a different format.`,
            });
            controller.close();
            return;
          }
        }

        sendEvent(controller, { type: "progress", percent: 1, fps: "—", speed: "—", stage: "Starting FFmpeg…" });

        const outputBuffer = await convertMediaWithProgress(
          inputBuffer,
          parsedOptions,
          (percent, fps, speed) => {
            sendEvent(controller, {
              type: "progress",
              percent,
              fps,
              speed,
              stage: percent < 100 ? "Encoding…" : "Finalizing…",
            });
          }
        );

        // Send the converted file as base64 in the final SSE event
        const base64 = outputBuffer.toString("base64");
        sendEvent(controller, {
          type: "done",
          base64,
          filename: downloadFileName,
          mimeType,
          bytes: outputBuffer.byteLength,
        });
        controller.close();
      } catch (err: any) {
        sendEvent(controller, { type: "error", message: err?.message ?? "Conversion failed" });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

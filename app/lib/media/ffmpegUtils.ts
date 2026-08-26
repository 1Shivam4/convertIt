import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import ffmpegPathStatic from "ffmpeg-static";

const execFileAsync = promisify(execFile);

function getExecutableFFmpegPath(): string {
  if (process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  const localStaticPath = join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg");
  if (existsSync(localStaticPath)) {
    return localStaticPath;
  }
  if (typeof ffmpegPathStatic === "string" && existsSync(ffmpegPathStatic)) {
    return ffmpegPathStatic;
  }
  if (existsSync("/usr/local/bin/ffmpeg")) {
    return "/usr/local/bin/ffmpeg";
  }
  if (existsSync("/usr/bin/ffmpeg")) {
    return "/usr/bin/ffmpeg";
  }
  return "ffmpeg";
}

export interface FFmpegOptions {
  selectedFormatId: string;
  resolution?: "original" | "1080p" | "720p" | "480p" | "360p";
  videoBitrate?: "auto" | "1m" | "2.5m" | "5m" | "8m";
  audioBitrate?: "auto" | "128k" | "192k" | "320k";
  fps?: number;
  startTime?: string;
  endTime?: string;
  muteAudio?: boolean;
  speedFactor?: number;
}

export function buildFFmpegArgs(
  inputPath: string,
  outputPath: string,
  options: FFmpegOptions
): string[] {
  const args: string[] = [];

  // Trimming start time (placed before -i for fast seek)
  if (options.startTime && options.startTime.trim() !== "") {
    args.push("-ss", options.startTime.trim());
  }

  // Trimming end time
  if (options.endTime && options.endTime.trim() !== "") {
    args.push("-to", options.endTime.trim());
  }

  args.push("-i", inputPath);

  const isAudioOnlyFormat = ["mp3", "wav", "aac", "flac", "ogg"].includes(
    options.selectedFormatId.toLowerCase()
  );

  const videoFilters: string[] = [];
  const audioFilters: string[] = [];

  if (isAudioOnlyFormat) {
    args.push("-vn"); // Disable video stream
    switch (options.selectedFormatId.toLowerCase()) {
      case "mp3":
        args.push("-c:a", "libmp3lame");
        break;
      case "wav":
        args.push("-c:a", "pcm_s16le");
        break;
      case "aac":
        args.push("-c:a", "aac");
        break;
      case "flac":
        args.push("-c:a", "flac");
        break;
      case "ogg":
        args.push("-c:a", "vorbis", "-strict", "-2", "-ac", "2");
        break;
    }

    // Speed factor for audio-only formats via atempo filter
    if (options.speedFactor && options.speedFactor !== 1.0) {
      // atempo supports 0.5–2.0; chain multiple stages for values outside that range
      let remaining = options.speedFactor;
      const stages: string[] = [];
      while (remaining > 2.0) {
        stages.push("atempo=2.0");
        remaining /= 2.0;
      }
      while (remaining < 0.5) {
        stages.push("atempo=0.5");
        remaining /= 0.5;
      }
      stages.push(`atempo=${remaining.toFixed(4)}`);
      audioFilters.push(...stages);
    }
  } else if (options.selectedFormatId.toLowerCase() === "gif") {
    // GIF is only suitable for short clips — hard-cap at 10 seconds
    args.push("-t", "10");
    // High-quality palette generation for GIF
    args.push(
      "-vf",
      "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"
    );
    args.push("-an"); // No audio in GIF
  } else {
    // Standard video formats: mp4, webm, mov, avi, mkv, compress-video
    switch (options.selectedFormatId.toLowerCase()) {
      case "mp4":
      case "compress-video":
        args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
        if (options.selectedFormatId.toLowerCase() === "compress-video") {
          args.push("-crf", "28");
        }
        break;
      case "webm":
        args.push("-c:v", "libvpx-vp9", "-c:a", "opus", "-strict", "-2");
        break;
      case "mov":
        args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
        break;
      case "avi":
        args.push("-c:v", "mpeg4", "-c:a", "aac");
        break;
      case "mkv":
        args.push("-c:v", "libx264", "-preset", "fast", "-c:a", "aac");
        break;
    }

    // Resolution scaling
    if (options.resolution && options.resolution !== "original") {
      switch (options.resolution) {
        case "1080p":
          videoFilters.push("scale=1920:-2");
          break;
        case "720p":
          videoFilters.push("scale=1280:-2");
          break;
        case "480p":
          videoFilters.push("scale=854:-2");
          break;
        case "360p":
          videoFilters.push("scale=640:-2");
          break;
      }
    }

    // Frame rate
    if (options.fps && options.fps > 0) {
      videoFilters.push(`fps=${options.fps}`);
    }

    // Speed factor adjustments
    if (options.speedFactor && options.speedFactor !== 1.0) {
      const ptsFactor = (1 / options.speedFactor).toFixed(4);
      videoFilters.push(`setpts=${ptsFactor}*PTS`);
      audioFilters.push(`atempo=${options.speedFactor}`);
    }

    // Bitrate overrides
    if (options.videoBitrate && options.videoBitrate !== "auto") {
      args.push("-b:v", options.videoBitrate);
    }

    // Mute audio stream
    if (options.muteAudio) {
      args.push("-an");
    }
  }

  // Audio bitrate override (if audio is enabled)
  if (!options.muteAudio && options.audioBitrate && options.audioBitrate !== "auto") {
    args.push("-b:a", options.audioBitrate);
  }

  // Apply filters if any exist
  if (videoFilters.length > 0) {
    args.push("-vf", videoFilters.join(","));
  }
  if (audioFilters.length > 0 && !options.muteAudio) {
    args.push("-af", audioFilters.join(","));
  }

  // Overwrite output file
  args.push("-y", outputPath);

  return args;
}

export async function convertMediaWithFFmpeg(
  inputBuffer: Buffer,
  options: FFmpegOptions
): Promise<Buffer> {
  const jobId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const ext = options.selectedFormatId === "compress-video" ? "mp4" : options.selectedFormatId;
  const inputPath = join(tmpdir(), `convertit_${jobId}_input`);
  const outputPath = join(tmpdir(), `convertit_${jobId}_output.${ext}`);

  try {
    await writeFile(inputPath, inputBuffer);
    const args = buildFFmpegArgs(inputPath, outputPath, options);

    const ffmpegPath = getExecutableFFmpegPath();

    try {
      await execFileAsync(ffmpegPath, args, {
        timeout: 120000, // 2-minute max execution timeout
        env: {
          ...process.env,
          PATH: `${process.env.PATH || ""}:/usr/local/bin:/usr/bin:/bin`,
        },
      });
    } catch (err: any) {
      if (err?.message?.includes("libmp3lame")) {
        // Fallback for custom builds missing libmp3lame: retry using native built-in AAC audio codec
        const fallbackArgs = args.map((arg) => (arg === "libmp3lame" ? "aac" : arg));
        await execFileAsync(ffmpegPath, fallbackArgs, {
          timeout: 120000,
          env: {
            ...process.env,
            PATH: `${process.env.PATH || ""}:/usr/local/bin:/usr/bin:/bin`,
          },
        });
      } else {
        throw err;
      }
    }

    const resultBuffer = await readFile(outputPath);
    return resultBuffer;
  } catch (err: any) {
    throw new Error(`FFmpeg processing failed: ${err?.message || String(err)}`);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

/**
 * Spawn-based FFmpeg conversion with real-time progress callbacks.
 * Uses FFmpeg's `-progress pipe:1` to emit structured progress data.
 * Fixes the hang issue caused by execFile's fixed timeout.
 */
export function convertMediaWithProgress(
  inputBuffer: Buffer,
  options: FFmpegOptions,
  onProgress: (percent: number, fps: string, speed: string) => void
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const jobId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const ext = options.selectedFormatId === "compress-video" ? "mp4" : options.selectedFormatId;
    const inputPath = join(tmpdir(), `convertit_${jobId}_input`);
    const outputPath = join(tmpdir(), `convertit_${jobId}_output.${ext}`);

    const cleanup = () => {
      unlink(inputPath).catch(() => {});
      unlink(outputPath).catch(() => {});
    };

    writeFile(inputPath, inputBuffer).then(() => {
      const rawArgs = buildFFmpegArgs(inputPath, outputPath, options);

      // Insert -progress pipe:1 before the final -y <output> pair
      const progressArgs: string[] = [];
      for (let i = 0; i < rawArgs.length; i++) {
        if (rawArgs[i] === "-y") {
          progressArgs.push("-progress", "pipe:1", "-y");
        } else {
          progressArgs.push(rawArgs[i]);
        }
      }

      const ffmpegBin = getExecutableFFmpegPath();
      const proc = spawn(ffmpegBin, progressArgs, {
        env: { ...process.env, PATH: `${process.env.PATH || ""}:/usr/local/bin:/usr/bin:/bin` },
      });

      // ── Parse total duration from stderr ──────────────────────────────
      let totalMs = 0;
      let stderrBuf = "";
      proc.stderr.on("data", (chunk: Buffer) => {
        stderrBuf += chunk.toString();
        if (!totalMs) {
          const m = stderrBuf.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
          if (m) {
            totalMs = (parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3])) * 1000;
          }
        }
      });

      // ── Parse progress lines from stdout ──────────────────────────────
      let stdoutBuf = "";
      let block: Record<string, string> = {};
      proc.stdout.on("data", (chunk: Buffer) => {
        stdoutBuf += chunk.toString();
        const lines = stdoutBuf.split("\n");
        stdoutBuf = lines.pop() ?? "";
        for (const line of lines) {
          const eq = line.indexOf("=");
          if (eq === -1) continue;
          const key = line.slice(0, eq).trim();
          const val = line.slice(eq + 1).trim();
          block[key] = val;
          if (key === "progress") {
            if (totalMs > 0 && block.out_time_ms) {
              const outMs = parseInt(block.out_time_ms) / 1000;
              const pct = Math.min(99, Math.round((outMs / totalMs) * 100));
              onProgress(pct, block.fps ?? "0", block.speed ?? "0x");
            }
            block = {};
          }
        }
      });

      proc.on("error", (err) => { cleanup(); reject(err); });

      proc.on("close", async (code) => {
        if (code !== 0) {
          cleanup();
          reject(new Error(`FFmpeg exited with code ${code}.\n${stderrBuf.slice(-800)}`));
          return;
        }
        try {
          const buf = await readFile(outputPath);
          onProgress(100, "—", "—");
          cleanup();
          resolve(buf);
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
    }).catch(reject);
  });
}

import { describe, it, expect } from "vitest";
import { buildFFmpegArgs } from "@/app/lib/media/ffmpegUtils";

describe("buildFFmpegArgs", () => {
  it("builds correct args for standard MP4 conversion", () => {
    const args = buildFFmpegArgs("/tmp/input.mp4", "/tmp/output.mp4", {
      selectedFormatId: "mp4",
      resolution: "original",
    });

    expect(args).toContain("-i");
    expect(args).toContain("/tmp/input.mp4");
    expect(args).toContain("-c:v");
    expect(args).toContain("libx264");
    expect(args).toContain("-c:a");
    expect(args).toContain("aac");
    expect(args).toContain("/tmp/output.mp4");
  });

  it("builds correct args for MP3 audio extraction with -vn", () => {
    const args = buildFFmpegArgs("/tmp/input.mp4", "/tmp/output.mp3", {
      selectedFormatId: "mp3",
    });

    expect(args).toContain("-vn");
    expect(args).toContain("-c:a");
    expect(args).toContain("libmp3lame");
    expect(args).toContain("/tmp/output.mp3");
  });

  it("applies resolution scaling and trimming flags", () => {
    const args = buildFFmpegArgs("/tmp/input.mp4", "/tmp/output.mp4", {
      selectedFormatId: "mp4",
      resolution: "720p",
      startTime: "00:00:05",
      endTime: "00:00:20",
      muteAudio: true,
    });

    expect(args).toContain("-ss");
    expect(args).toContain("00:00:05");
    expect(args).toContain("-to");
    expect(args).toContain("00:00:20");
    expect(args).toContain("-vf");
    expect(args).toContain("scale=1280:-2");
    expect(args).toContain("-an");
  });

  it("builds correct palette generation flags for GIF creation", () => {
    const args = buildFFmpegArgs("/tmp/input.mp4", "/tmp/output.gif", {
      selectedFormatId: "gif",
    });

    expect(args).toContain("-vf");
    expect(args.join(" ")).toContain("palettegen");
  });
});

import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { processImageTransform, generateIcoFavicon } from "@/app/lib/image/sharpUtils";

describe("sharpUtils", () => {
  it("converts a sample image to JPEG with custom quality and resizing", async () => {
    // Generate a simple 100x100 PNG buffer
    const inputBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 0, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await processImageTransform(inputBuffer, {
      targetFormat: "jpg",
      quality: 80,
      width: 50,
      height: 50,
      rotateAngle: "90",
      grayscale: true,
    });

    expect(result.contentType).toBe("image/jpeg");
    expect(result.extension).toBe(".jpg");
    expect(result.buffer).toBeInstanceOf(Buffer);

    // Verify metadata of output
    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(50);
    expect(meta.height).toBe(50);
    expect(meta.format).toBe("jpeg");
  });

  it("generates a 32x32 ICO favicon buffer", async () => {
    const inputBuffer = await sharp({
      create: {
        width: 128,
        height: 128,
        channels: 4,
        background: { r: 0, g: 128, b: 255, alpha: 1 },
      },
    })
      .png()
      .toBuffer();

    const result = await generateIcoFavicon(inputBuffer);

    expect(result.contentType).toBe("image/x-icon");
    expect(result.extension).toBe(".ico");

    const meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(32);
    expect(meta.height).toBe(32);
  });
});

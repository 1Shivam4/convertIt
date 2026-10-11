import sharp from "sharp";
import convertHeic from "heic-convert";

export interface ImageTransformOptions {
  targetFormat: string;
  quality?: number;
  width?: number | null;
  height?: number | null;
  fitMode?: "cover" | "contain" | "fill" | "inside" | "outside";
  rotateAngle?: "0" | "90" | "180" | "270";
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  grayscale?: boolean;
  stripExif?: boolean;
  backgroundColor?: string;
}

export interface ConvertedImageResult {
  buffer: Buffer;
  contentType: string;
  extension: string;
}

/**
 * Checks if a buffer represents an Apple HEIC / HEIF image container.
 */
function isHeicBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const brand = buffer.toString("ascii", 4, 12);
  return (
    brand.includes("ftypheic") ||
    brand.includes("ftypmif1") ||
    brand.includes("ftypmsf1") ||
    brand.includes("ftyphevc") ||
    brand.includes("ftypheix") ||
    brand.includes("heic") ||
    brand.includes("heix") ||
    brand.includes("mif1")
  );
}

/**
 * Checks if a buffer represents a Windows ICO container.
 */
function isIcoBuffer(buffer: Buffer): boolean {
  if (buffer.length < 6) return false;
  return buffer.readUInt16LE(0) === 0 && buffer.readUInt16LE(2) === 1;
}

/**
 * Extracts a high-res image buffer (PNG or BMP) from an ICO container for Sharp processing.
 */
function extractImageFromIco(icoBuf: Buffer): Buffer {
  if (icoBuf.length < 22) return icoBuf;
  if (!isIcoBuffer(icoBuf)) return icoBuf;

  const count = icoBuf.readUInt16LE(4);
  if (count === 0) return icoBuf;

  let bestOffset = 0;
  let bestSize = 0;
  let maxArea = -1;

  for (let i = 0; i < count; i++) {
    const entryOffset = 6 + i * 16;
    if (entryOffset + 16 > icoBuf.length) break;
    const w = icoBuf.readUInt8(entryOffset) || 256;
    const h = icoBuf.readUInt8(entryOffset + 1) || 256;
    const size = icoBuf.readUInt32LE(entryOffset + 8);
    const offset = icoBuf.readUInt32LE(entryOffset + 12);

    if (w * h > maxArea && offset + size <= icoBuf.length) {
      maxArea = w * h;
      bestOffset = offset;
      bestSize = size;
    }
  }

  if (bestSize === 0 || bestOffset === 0) return icoBuf;

  const slice = icoBuf.subarray(bestOffset, bestOffset + bestSize);

  // If the extracted slice is a PNG image (starts with PNG signature)
  if (
    slice.length >= 8 &&
    slice[0] === 0x89 &&
    slice[1] === 0x50 &&
    slice[2] === 0x4e &&
    slice[3] === 0x47
  ) {
    return slice;
  }

  // If the slice is a BMP/DIB inside ICO, wrap with standard 14-byte BMP header
  if (slice.length >= 40) {
    const dibWidth = slice.readInt32LE(4);
    const dibHeight = Math.floor(slice.readInt32LE(8) / 2); // In ICO, DIB height is doubled
    const bpp = slice.readUInt16LE(14);

    const bmpHeader = Buffer.alloc(14);
    bmpHeader.write("BM", 0, 2, "ascii");
    const rowSize = Math.floor((bpp * dibWidth + 31) / 32) * 4;
    const pixelArraySize = rowSize * dibHeight;
    const totalFileSize = 14 + 40 + pixelArraySize;
    bmpHeader.writeUInt32LE(totalFileSize, 2);
    bmpHeader.writeUInt32LE(14 + 40, 10);

    const newDib = Buffer.from(slice.subarray(0, 40));
    newDib.writeInt32LE(dibHeight, 8); // set corrected height
    const pixelData = slice.subarray(40, 40 + pixelArraySize);
    return Buffer.concat([bmpHeader, newDib, pixelData]);
  }

  return slice;
}

/**
 * Encodes raw RGB/RGBA pixel data into a standard 24-bit uncompressed BMP Buffer.
 */
function encodeBmpBuffer(
  rawData: Buffer,
  width: number,
  height: number,
  channels: number,
): Buffer {
  const bytesPerPixel = 3; // 24-bit BGR
  const rowSize = Math.floor((24 * width + 31) / 32) * 4; // 4-byte aligned row
  const pixelArraySize = rowSize * height;
  const fileHeaderSize = 14;
  const dibHeaderSize = 40;
  const fileSize = fileHeaderSize + dibHeaderSize + pixelArraySize;

  const buf = Buffer.alloc(fileSize);

  // Bitmap File Header (14 bytes)
  buf.write("BM", 0, 2, "ascii");
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // Positive = bottom-to-top
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);

  // Copy pixels (BMP is stored bottom-to-top in BGR channel order)
  for (let y = 0; y < height; y++) {
    const srcRow = (height - 1 - y) * width * channels;
    const destRow = fileHeaderSize + dibHeaderSize + y * rowSize;

    for (let x = 0; x < width; x++) {
      const srcPx = srcRow + x * channels;
      const destPx = destRow + x * bytesPerPixel;

      buf[destPx] = rawData[srcPx + 2]; // Blue
      buf[destPx + 1] = rawData[srcPx + 1]; // Green
      buf[destPx + 2] = rawData[srcPx]; // Red
    }
  }

  return buf;
}

/**
 * Encodes a PNG image buffer into a standard binary .ICO file container.
 */
function encodeIcoBuffer(
  pngBuffer: Buffer,
  width: number,
  height: number,
): Buffer {
  const header = Buffer.alloc(6 + 16);
  // ICONDIR (6 bytes)
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // resource type (1 = icon)
  header.writeUInt16LE(1, 4); // icon count (1 image)

  // ICONDIRENTRY (16 bytes)
  header.writeUInt8(width >= 256 ? 0 : width, 6); // width (0 = 256)
  header.writeUInt8(height >= 256 ? 0 : height, 7); // height (0 = 256)
  header.writeUInt8(0, 8); // color palette count
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(pngBuffer.length, 14); // image size in bytes
  header.writeUInt32LE(22, 18); // byte offset to image data (6 + 16 = 22)

  return Buffer.concat([header, pngBuffer]);
}

/**
 * Checks if a buffer represents an uncompressed BMP image container.
 */
function isBmpBuffer(buffer: Buffer): boolean {
  return buffer.length >= 54 && buffer.toString("ascii", 0, 2) === "BM";
}

/**
 * Decodes 24-bit or 32-bit uncompressed BMP buffers into raw RGB pixel data.
 */
function decodeBmpBuffer(bmpBuf: Buffer): {
  rawData: Buffer;
  width: number;
  height: number;
  channels: number;
} | null {
  if (!isBmpBuffer(bmpBuf)) return null;
  const dataOffset = bmpBuf.readUInt32LE(10);
  const width = bmpBuf.readInt32LE(18);
  const rawHeight = bmpBuf.readInt32LE(22);
  const height = Math.abs(rawHeight);
  const isBottomUp = rawHeight > 0;
  const bpp = bmpBuf.readUInt16LE(28);
  if (bpp !== 24 && bpp !== 32) return null;

  const channels = 3;
  const rawData = Buffer.alloc(width * height * channels);
  const bytesPerPixel = bpp / 8;
  const rowSize = Math.floor((bpp * width + 31) / 32) * 4;

  for (let y = 0; y < height; y++) {
    const srcY = isBottomUp ? height - 1 - y : y;
    const srcRow = dataOffset + srcY * rowSize;
    const destRow = y * width * channels;

    for (let x = 0; x < width; x++) {
      const srcPx = srcRow + x * bytesPerPixel;
      const destPx = destRow + x * channels;
      rawData[destPx] = bmpBuf[srcPx + 2]; // Red
      rawData[destPx + 1] = bmpBuf[srcPx + 1]; // Green
      rawData[destPx + 2] = bmpBuf[srcPx]; // Blue
    }
  }

  return { rawData, width, height, channels };
}

/**
 * Transforms an image buffer using Sharp based on provided options.
 * Supports all 12 formats: JPG, JPEG, PNG, WebP, AVIF, GIF, TIFF, BMP, ICO, SVG, HEIC, HEIF.
 */
export async function processImageTransform(
  inputBuffer: Buffer,
  options: ImageTransformOptions,
): Promise<ConvertedImageResult> {
  // 1. Decode HEIC/HEIF containers into standard PNG if detected
  if (isHeicBuffer(inputBuffer)) {
    try {
      const decodedBuffer = await convertHeic({
        buffer: inputBuffer,
        format: "PNG",
      });
      inputBuffer = Buffer.from(decodedBuffer);
    } catch (err) {
      console.error("HEIC decoding fallback error:", err);
    }
  }

  // 2. Decode ICO input container if detected
  if (isIcoBuffer(inputBuffer)) {
    try {
      inputBuffer = extractImageFromIco(inputBuffer);
    } catch (err) {
      console.error("ICO parsing fallback error:", err);
    }
  }

  // 3. Decode BMP input buffer if detected (enables BMP input decoding)
  let pipeline: sharp.Sharp;
  const bmpDecoded = isBmpBuffer(inputBuffer) ? decodeBmpBuffer(inputBuffer) : null;
  if (bmpDecoded) {
    pipeline = sharp(bmpDecoded.rawData, {
      raw: {
        width: bmpDecoded.width,
        height: bmpDecoded.height,
        channels: bmpDecoded.channels as any,
      },
    });
  } else {
    pipeline = sharp(inputBuffer);
  }

  // Auto-rotate based on EXIF orientation if available (only for containers with EXIF)
  if (!bmpDecoded) {
    pipeline = pipeline.rotate();
  }

  // Explicit rotation
  if (options.rotateAngle && options.rotateAngle !== "0") {
    pipeline = pipeline.rotate(parseInt(options.rotateAngle, 10));
  }

  // Flips
  if (options.flipVertical) {
    pipeline = pipeline.flip();
  }
  if (options.flipHorizontal) {
    pipeline = pipeline.flop();
  }

  // Grayscale / Monochromatic
  if (options.grayscale) {
    pipeline = pipeline.grayscale();
  }

  // Resizing
  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width || undefined,
      height: options.height || undefined,
      fit: options.fitMode || "cover",
      withoutEnlargement: false,
    });
  }

  // Metadata stripping
  if (!options.stripExif) {
    pipeline = pipeline.withMetadata();
  }

  const quality = Math.min(Math.max(options.quality || 85, 1), 100);
  const targetFormat = (options.targetFormat || "jpg").toLowerCase();

  // Background flattening for formats without alpha channel
  if (
    targetFormat === "jpg" ||
    targetFormat === "jpeg" ||
    targetFormat === "bmp"
  ) {
    const bgColor = options.backgroundColor || "#ffffff";
    pipeline = pipeline.flatten({ background: bgColor });
  }

  let contentType = "image/jpeg";
  let extension = ".jpg";

  switch (targetFormat) {
    case "png":
      contentType = "image/png";
      extension = ".png";
      pipeline = pipeline.png({ compressionLevel: 6 });
      break;

    case "webp":
      contentType = "image/webp";
      extension = ".webp";
      pipeline = pipeline.webp({ quality });
      break;

    case "avif":
      contentType = "image/avif";
      extension = ".avif";
      pipeline = pipeline.avif({ quality });
      break;

    case "gif":
      contentType = "image/gif";
      extension = ".gif";
      pipeline = pipeline.gif();
      break;

    case "tiff":
      contentType = "image/tiff";
      extension = ".tiff";
      pipeline = pipeline.tiff({ quality });
      break;

    case "bmp": {
      contentType = "image/bmp";
      extension = ".bmp";
      const { data, info } = await pipeline
        .raw()
        .toBuffer({ resolveWithObject: true });
      const buffer = encodeBmpBuffer(
        data,
        info.width,
        info.height,
        info.channels,
      );
      return { buffer, contentType, extension };
    }

    case "ico": {
      contentType = "image/x-icon";
      extension = ".ico";
      const targetW = options.width ? Math.min(options.width, 256) : 32;
      const targetH = options.height ? Math.min(options.height, 256) : 32;
      const icoPngBuffer = await pipeline
        .resize(targetW, targetH, { fit: options.fitMode || "contain" })
        .png()
        .toBuffer();
      const buffer = encodeIcoBuffer(icoPngBuffer, targetW, targetH);
      return { buffer, contentType, extension };
    }

    case "svg": {
      contentType = "image/svg+xml";
      extension = ".svg";
      const pngBuffer = await pipeline.png().toBuffer();
      const meta = await sharp(pngBuffer).metadata();
      const w = meta.width || 800;
      const h = meta.height || 600;
      const base64Png = pngBuffer.toString("base64");
      const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <image width="${w}" height="${h}" xlink:href="data:image/png;base64,${base64Png}" />
</svg>`;
      return {
        buffer: Buffer.from(svgString, "utf-8"),
        contentType,
        extension,
      };
    }

    case "heic":
      contentType = "image/heic";
      extension = ".heic";
      pipeline = pipeline.heif({ compression: "av1", quality });
      break;

    case "heif":
      contentType = "image/heif";
      extension = ".heif";
      pipeline = pipeline.heif({ compression: "av1", quality });
      break;

    case "jpeg":
      contentType = "image/jpeg";
      extension = ".jpeg";
      pipeline = pipeline.jpeg({ quality, progressive: true });
      break;

    case "jpg":
    default:
      contentType = "image/jpeg";
      extension = ".jpg";
      pipeline = pipeline.jpeg({ quality, progressive: true });
      break;
  }

  const buffer = await pipeline.toBuffer();

  return {
    buffer,
    contentType,
    extension,
  };
}

/**
 * Generates a multi-resolution favicon buffer (.ico) from an input image.
 */
export async function generateIcoFavicon(
  inputBuffer: Buffer,
): Promise<ConvertedImageResult> {
  const icoPng = await sharp(inputBuffer)
    .resize(32, 32, { fit: "contain" })
    .png()
    .toBuffer();

  const buffer = encodeIcoBuffer(icoPng, 32, 32);

  return {
    buffer,
    contentType: "image/x-icon",
    extension: ".ico",
  };
}

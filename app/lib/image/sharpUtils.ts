import sharp from "sharp";

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
 * Transforms an image buffer using Sharp based on provided options.
 */
export async function processImageTransform(
  inputBuffer: Buffer,
  options: ImageTransformOptions,
): Promise<ConvertedImageResult> {
  let pipeline = sharp(inputBuffer);

  // Auto-rotate based on EXIF orientation if available
  pipeline = pipeline.rotate();

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

    case "jpg":
    case "jpeg":
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
 * Generates a 32x32 favicon buffer from an input image.
 */
export async function generateIcoFavicon(
  inputBuffer: Buffer,
): Promise<ConvertedImageResult> {
  const buffer = await sharp(inputBuffer)
    .resize(32, 32, { fit: "contain" })
    .png()
    .toBuffer();

  return {
    buffer,
    contentType: "image/x-icon",
    extension: ".ico",
  };
}

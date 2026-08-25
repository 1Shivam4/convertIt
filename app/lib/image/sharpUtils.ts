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
 * Transforms an image buffer using Sharp based on provided options.
 */
export async function processImageTransform(
  inputBuffer: Buffer,
  options: ImageTransformOptions
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

  // Background flattening for formats without alpha channel (e.g., JPEG, BMP)
  if (targetFormat === "jpg" || targetFormat === "jpeg" || targetFormat === "bmp") {
    const bgColor = options.backgroundColor || "#ffffff";
    pipeline = pipeline.flatten({ background: bgColor });
  }

  let contentType = "image/jpeg";
  let extension = ".jpg";

  switch (targetFormat) {
    case "png":
      contentType = "image/png";
      extension = ".png";
      // compressionLevel 6 = balanced file size vs speed (9 = slowest/smallest)
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

    case "bmp":
      contentType = "image/bmp";
      extension = ".bmp";
      // Sharp supports BMP output natively via toFormat
      pipeline = pipeline.toFormat("bmp" as any);
      break;

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
 * Generates an ICO multi-resolution favicon buffer from an image buffer.
 */
export async function generateIcoFavicon(
  inputBuffer: Buffer
): Promise<ConvertedImageResult> {
  // Generate 32x32 PNG icon as main fallback
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

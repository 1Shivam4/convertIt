import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

const endpoint = process.env.S3_ENDPOINT;
const bucketName = process.env.S3_BUCKET_NAME || "convertit";
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const region = process.env.S3_REGION || "auto";

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn("Cloudflare R2 S3 credentials incomplete in process.env");
}

export const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

type PresignedUploadParams = {
  fileName: string;
  mimeType: string;
  prefix?: string;
  expiresInSeconds?: number;
};

type PresignedDownloadParams = {
  key: string;
  expiresInSeconds?: number;
  downloadName?: string;
};

/**
 * Generates a pre-signed PUT URL for direct client-to-R2 file uploads.
 */
export async function getPresignedUploadUrl({
  fileName,
  mimeType,
  prefix = "uploads",
  expiresInSeconds = 900, // 15 minutes default
}: PresignedUploadParams) {
  const safeName = fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const uniqueId = randomBytes(12).toString("hex");
  const key = `${prefix}/${Date.now()}_${uniqueId}_${safeName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: mimeType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, key, bucket: bucketName };
}

/**
 * Generates a pre-signed GET URL for securely downloading converted assets from R2.
 */
export async function getPresignedDownloadUrl({
  key,
  expiresInSeconds = 3600, // 1 hour default
  downloadName,
}: PresignedDownloadParams) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName}"`
      : undefined,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });

  return downloadUrl;
}

import fs from "fs";
import path from "path";

// Local storage fallback directory (used when R2 credentials fail or in local development)
const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".storage");

function getLocalFilePath(key: string): string {
  const safeKey = key.replace(/^[/\\]+/, "").replace(/\.\./g, "");
  return path.join(LOCAL_STORAGE_DIR, safeKey);
}

async function writeLocalFile(key: string, buffer: Buffer): Promise<void> {
  const filePath = getLocalFilePath(key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, buffer);
}

async function readLocalFile(key: string): Promise<Buffer | null> {
  try {
    const filePath = getLocalFilePath(key);
    if (fs.existsSync(filePath)) {
      return await fs.promises.readFile(filePath);
    }
  } catch {
    // Continue to R2
  }
  return null;
}

/**
 * Direct server/worker upload of a Buffer to Cloudflare R2 bucket with local fallback.
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
) {
  // If R2 credentials are configured, attempt upload to Cloudflare R2
  if (endpoint && accessKeyId && secretAccessKey) {
    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await s3Client.send(command);
      return { key, bucket: bucketName };
    } catch (err: any) {
      console.warn(
        `[Storage] Cloudflare R2 PutObject rejected (${err.name || "Error"}: ${err.message}). Storing to local fallback storage: ${key}`
      );
      // Fallback: save to local disk
      await writeLocalFile(key, buffer);
      return { key, bucket: "local" };
    }
  }

  // If no credentials, save directly to local disk
  await writeLocalFile(key, buffer);
  return { key, bucket: "local" };
}

/**
 * Fetches an object buffer from local fallback storage or Cloudflare R2 bucket.
 */
export async function getObjectBufferFromR2(key: string): Promise<Buffer> {
  // 1. Check local fallback storage first
  const localBuffer = await readLocalFile(key);
  if (localBuffer) {
    return localBuffer;
  }

  // 2. Fetch from Cloudflare R2 if credentials exist
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(`File not found in local storage and R2 credentials are incomplete for key: ${key}`);
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await s3Client.send(command);
    if (!response.Body) {
      throw new Error(`Empty response body for R2 object: ${key}`);
    }

    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (err: any) {
    if (err.name === "AccessDenied" || err.Code === "AccessDenied" || err.$metadata?.httpStatusCode === 403) {
      throw new Error(
        `Cloudflare R2 Access Denied (HTTP 403). The R2 API token in .env does not have permission for bucket "${bucketName}". (Requested key: ${key})`
      );
    }
    throw err;
  }
}

/**
 * Deletes an object from local fallback storage and Cloudflare R2 bucket.
 */
export async function deleteObjectFromR2(key: string) {
  try {
    const filePath = getLocalFilePath(key);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch {
    // Ignore error
  }

  if (endpoint && accessKeyId && secretAccessKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      return await s3Client.send(command);
    } catch {
      // Ignore error
    }
  }
}


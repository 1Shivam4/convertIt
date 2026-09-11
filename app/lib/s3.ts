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

/**
 * Direct server/worker upload of a Buffer to Cloudflare R2 bucket.
 */
export async function uploadBufferToR2(
  buffer: Buffer,
  key: string,
  contentType: string,
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return { key, bucket: bucketName };
}

/**
 * Fetches an object buffer from Cloudflare R2 bucket.
 */
export async function getObjectBufferFromR2(key: string): Promise<Buffer> {
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
}

/**
 * Deletes an object from Cloudflare R2 bucket.
 */
export async function deleteObjectFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return s3Client.send(command);
}

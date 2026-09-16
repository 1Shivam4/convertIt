import { Queue } from "bullmq";
import { redisConnection } from "./redis";
import { prisma } from "./prisma";
import { sendEmail } from "./email";

// ── 1. Conversion Queue ──────────────────────────────────────────────────────
export const conversionQueue = new Queue("conversion", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 }, // clean up after 1hr
    removeOnFail: { age: 86400 }, // keep failed jobs 24hr for debugging
  },
});

// ── 2. Email Queue ───────────────────────────────────────────────────────────
export const emailQueue = new Queue("email", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

export type EnqueueEmailParams = {
  to: string;
  subject: string;
  html: string;
  type?: "verification" | "password-reset" | "notification" | "billing";
};

/**
 * Enqueues an email into BullMQ for background processing with automatic retries.
 * Falls back gracefully to direct SMTP send if Redis is offline during local dev.
 */
export async function enqueueEmailJob(params: EnqueueEmailParams) {
  try {
    if (redisConnection.status === "ready" || redisConnection.status === "connect") {
      const job = await emailQueue.add("send-email", params);
      return { success: true, jobId: job.id, mode: "queue" as const };
    }
  } catch (err) {
    console.warn("[EmailQueue] Queue unavailable, falling back to direct send:", err);
  }

  // Graceful fallback to direct SMTP send
  await sendEmail(params);
  return { success: true, mode: "direct" as const };
}

export type EnqueueJobParams = {
  userId?: string | null;
  sourceFormat: string;
  targetFormat: string;
  engine: string;
  inputS3Key?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  fileSize?: number;
  options?: Record<string, any>;
};

/**
 * Enqueues a conversion job into BullMQ and creates a QUEUED Job record in PostgreSQL.
 */
export async function enqueueConversionJob(params: EnqueueJobParams) {
  let s3Key = params.inputS3Key;

  // If buffer is provided directly, upload to R2 / storage
  if (!s3Key && params.fileBuffer) {
    const { uploadBufferToR2 } = await import("./s3");
    const safeName = (params.fileName || "input_file").replace(/[^a-zA-Z0-9_.-]/g, "_");
    s3Key = `uploads/${Date.now()}_${safeName}`;
    try {
      await uploadBufferToR2(
        params.fileBuffer,
        s3Key,
        `application/${params.sourceFormat}`
      );
    } catch (err) {
      console.warn("[Queue] R2 upload skipped or failed, storing local ref:", err);
    }
  }

  const finalKey = s3Key || `temp/${Date.now()}_${params.sourceFormat}`;

  // 1. Create Job record in PostgreSQL
  const dbJob = await prisma.job.create({
    data: {
      userId: params.userId || null,
      sourceFormat: params.sourceFormat,
      targetFormat: params.targetFormat,
      status: "QUEUED",
      conversions: {
        create: {
          engine: params.engine,
          startedAt: new Date(),
        },
      },
      files: {
        create: {
          path: finalKey,
          size: params.fileSize || params.fileBuffer?.byteLength || 0,
          mimeType: `application/${params.sourceFormat}`,
        },
      },
    },
  });

  // 2. Add job to BullMQ queue
  const queueJob = await conversionQueue.add("process-conversion", {
    jobId: dbJob.id,
    userId: params.userId || null,
    sourceFormat: params.sourceFormat,
    targetFormat: params.targetFormat,
    engine: params.engine,
    inputS3Key: finalKey,
    fileName: params.fileName,
    options: params.options || {},
  });

  return { jobId: dbJob.id, queueJobId: queueJob.id };
}

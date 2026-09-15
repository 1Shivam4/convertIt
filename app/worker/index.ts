import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import {
  getObjectBufferFromR2,
  uploadBufferToR2,
} from "../lib/s3";
import { processImageTransform } from "../lib/image/sharpUtils";
import type { EnqueueEmailParams } from "../lib/queue";

type ConversionJobPayload = {
  jobId: string;
  userId: string;
  sourceFormat: string;
  targetFormat: string;
  engine: string;
  inputS3Key: string;
  options: Record<string, any>;
};

console.log("🚀 Starting ConvertIt BullMQ Worker Process (Email & Conversion)...");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Email Worker Consumer (High Concurrency: 10)
// ─────────────────────────────────────────────────────────────────────────────
export const emailWorker = new Worker<EnqueueEmailParams>(
  "email",
  async (job: Job<EnqueueEmailParams>) => {
    const { to, subject, html, type } = job.data;
    console.log(`[Email Worker] Processing ${type || "general"} email to: ${to}...`);

    await sendEmail({ to, subject, html });

    console.log(`✅ [Email Worker] Email delivered to: ${to} (Subject: "${subject}")`);
    return { delivered: true, to };
  },
  {
    connection: redisConnection,
    concurrency: 10,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ [BullMQ:Email] Job ${job.id} completed.`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ [BullMQ:Email] Job ${job?.id} failed:`, err.message);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Conversion Worker Consumer (Concurrency: 5)
// ─────────────────────────────────────────────────────────────────────────────
export const conversionWorker = new Worker<ConversionJobPayload>(
  "conversion",
  async (job: Job<ConversionJobPayload>) => {
    const { jobId, targetFormat, engine, inputS3Key, options } = job.data;

    console.log(`[Conversion Worker] Processing job ${jobId} (engine: ${engine})...`);

    // 1. Update Job status to PROCESSING in Prisma
    await prisma.job.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    try {
      // 2. Fetch input file buffer from Cloudflare R2
      const inputBuffer = await getObjectBufferFromR2(inputS3Key);

      let outputBuffer: Buffer;
      let contentType = "application/octet-stream";
      let extension = `.${targetFormat}`;

      // 3. Execute conversion engine
      if (engine === "sharp") {
        const result = await processImageTransform(inputBuffer, {
          targetFormat,
          ...options,
        });
        outputBuffer = result.buffer;
        contentType = result.contentType;
        extension = result.extension;
      } else {
        // Fallback buffer for unhandled custom engines
        outputBuffer = inputBuffer;
      }

      // 4. Upload converted output file directly to Cloudflare R2
      const outputKey = `outputs/${jobId}/converted${extension}`;
      await uploadBufferToR2(outputBuffer, outputKey, contentType);

      // 5. Update Job and File records in Prisma
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          updatedAt: new Date(),
          files: {
            create: {
              path: outputKey,
              size: outputBuffer.byteLength,
              mimeType: contentType,
            },
          },
          conversions: {
            updateMany: {
              where: { jobId },
              data: {
                finishedAt: new Date(),
              },
            },
          },
        },
      });

      console.log(`[Conversion Worker] Job ${jobId} COMPLETED successfully.`);
      return { outputKey };
    } catch (err: any) {
      console.error(`[Conversion Worker] Job ${jobId} FAILED:`, err.message);

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          conversions: {
            updateMany: {
              where: { jobId },
              data: {
                finishedAt: new Date(),
                error: err.message,
              },
            },
          },
        },
      });

      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

conversionWorker.on("completed", (job) => {
  console.log(`✅ [BullMQ:Conversion] Job ${job.id} completed.`);
});

conversionWorker.on("failed", (job, err) => {
  console.error(`❌ [BullMQ:Conversion] Job ${job?.id} failed:`, err.message);
});

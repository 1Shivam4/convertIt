import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";
import {
  getObjectBufferFromR2,
  uploadBufferToR2,
  getPresignedDownloadUrl,
} from "../lib/s3";
import { processImageTransform } from "../lib/image/sharpUtils";

type JobPayload = {
  jobId: string;
  userId: string;
  sourceFormat: string;
  targetFormat: string;
  engine: string;
  inputS3Key: string;
  options: Record<string, any>;
};

console.log("🚀 Starting ConvertIt BullMQ Worker Consumer...");

const worker = new Worker<JobPayload>(
  "conversion",
  async (job: Job<JobPayload>) => {
    const { jobId, targetFormat, engine, inputS3Key, options } = job.data;

    console.log(`[Worker] Processing job ${jobId} (engine: ${engine})...`);

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

      console.log(`[Worker] Job ${jobId} COMPLETED successfully.`);
      return { outputKey };
    } catch (err: any) {
      console.error(`[Worker] Job ${jobId} FAILED:`, err.message);

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
  },
);

worker.on("completed", (job) => {
  console.log(`✅ [BullMQ] Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ [BullMQ] Job ${job?.id} failed:`, err.message);
});

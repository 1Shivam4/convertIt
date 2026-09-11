import { Queue } from "bullmq";
import { redisConnection } from "./redis";
import { prisma } from "./prisma";

export const conversionQueue = new Queue("conversion", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 }, // clean up after 1hr
    removeOnFail: { age: 86400 }, // keep failed jobs 24hr for debugging
  },
});

export type EnqueueJobParams = {
  userId: string;
  sourceFormat: string;
  targetFormat: string;
  engine: string;
  inputS3Key: string;
  options?: Record<string, any>;
};

/**
 * Enqueues a conversion job into BullMQ and creates a QUEUED Job record in PostgreSQL.
 */
export async function enqueueConversionJob(params: EnqueueJobParams) {
  // 1. Create Job record in PostgreSQL
  const dbJob = await prisma.job.create({
    data: {
      userId: params.userId,
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
          path: params.inputS3Key,
          size: 0,
          mimeType: `application/${params.sourceFormat}`,
        },
      },
    },
  });

  // 2. Add job to BullMQ queue
  const queueJob = await conversionQueue.add("process-conversion", {
    jobId: dbJob.id,
    userId: params.userId,
    sourceFormat: params.sourceFormat,
    targetFormat: params.targetFormat,
    engine: params.engine,
    inputS3Key: params.inputS3Key,
    options: params.options || {},
  });

  return { jobId: dbJob.id, queueJobId: queueJob.id };
}

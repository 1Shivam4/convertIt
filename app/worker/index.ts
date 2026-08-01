import { Worker } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/prisma";

const worker = new Worker("conversion", async (job) => {}, {
  connection: redisConnection,
  concurrency: 5,
});

worker.on("completed", (job) => console.log(`Job ${job.id} completed`));
worker.on("failed", (job, err) =>
  console.log(`Job ${job?.id} failed:`, err.message),
);

import { Queue } from "bullmq";
import { redisConnection } from "./redis";

export const conversionQueue = new Queue("conversion", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { age: 3600 }, // clean up after 1hr
    removeOnFail: { age: 86400 }, // keep failed jobs 24hr for debugging
  },
});

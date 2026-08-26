import { z } from "zod";

export const mediaConverterSchema = z.object({
  selectedFormatId: z.string().min(1, "Selected format is required"),
  resolution: z
    .enum(["original", "1080p", "720p", "480p", "360p"])
    .optional()
    .default("original"),
  videoBitrate: z
    .enum(["auto", "1m", "2.5m", "5m", "8m"])
    .optional()
    .default("auto"),
  audioBitrate: z
    .enum(["auto", "128k", "192k", "320k"])
    .optional()
    .default("auto"),
  fps: z.number().nonnegative().optional().default(0),
  startTime: z.string().optional().default(""),
  endTime: z.string().optional().default(""),
  muteAudio: z.boolean().optional().default(false),
  speedFactor: z.number().positive().optional().default(1.0),
});

export type MediaConverterInput = z.infer<typeof mediaConverterSchema>;

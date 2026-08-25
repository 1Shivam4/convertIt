import { z } from "zod";

export const imageConverterSchema = z.object({
  selectedFormatId: z.string().min(1, "Please select an image format"),
  quality: z.number().min(1).max(100).default(85),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  fitMode: z
    .enum(["cover", "contain", "fill", "inside", "outside"])
    .default("cover"),
  rotateAngle: z.enum(["0", "90", "180", "270"]).default("0"),
  flipHorizontal: z.boolean().default(false),
  flipVertical: z.boolean().default(false),
  grayscale: z.boolean().default(false),
  stripExif: z.boolean().default(true),
  backgroundColor: z.string().optional().default("#ffffff"),
});

export type ImageConverterFormValues = z.infer<typeof imageConverterSchema>;

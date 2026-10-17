import { z } from "zod";

export const imageConverterSchema = z.object({
  selectedFormatId: z.string().min(1, "Please select an image format"),
  quality: z.number().min(1).max(100),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  fitMode: z.enum(["cover", "contain", "fill", "inside", "outside"]),
  rotateAngle: z.enum(["0", "90", "180", "270"]),
  flipHorizontal: z.boolean(),
  flipVertical: z.boolean(),
  grayscale: z.boolean(),
  stripExif: z.boolean(),
  backgroundColor: z.string().optional(),
});

export type ImageConverterFormValues = z.infer<typeof imageConverterSchema>;

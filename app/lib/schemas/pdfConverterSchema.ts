import { z } from "zod";

export const pdfConverterSchema = z
  .object({
    selectedFormatId: z.string().min(1, "Please select a conversion format"),
    rotateAngle: z.enum(["90", "180", "270"]),
    pdfaVersion: z.enum(["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"]),
    password: z.string(),
    splitSpan: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.selectedFormatId === "encrypt" ||
        data.selectedFormatId === "decrypt"
      ) {
        return Boolean(data.password && data.password.trim().length > 0);
      }
      return true;
    },
    {
      message: "Please enter the PDF password.",
      path: ["password"],
    }
  )
  .refine(
    (data) => {
      if (data.selectedFormatId === "split") {
        return Boolean(data.splitSpan && data.splitSpan.trim().length > 0);
      }
      return true;
    },
    {
      message: "Please enter a valid page range (e.g. 1-3, 5).",
      path: ["splitSpan"],
    }
  );

export type PDFConverterFormValues = z.infer<typeof pdfConverterSchema>;

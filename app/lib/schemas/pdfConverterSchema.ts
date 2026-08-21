import { z } from "zod";

export const pdfConverterSchema = z
  .object({
    selectedFormatId: z.string().min(1, "Please select a conversion format"),
    rotateAngle: z.enum(["90", "180", "270"]),
    pdfaVersion: z.enum(["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"]),
    password: z.string(),
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
  );

export type PDFConverterFormValues = z.infer<typeof pdfConverterSchema>;

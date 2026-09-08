import { z } from "zod";

export const pdfConverterSchema = z
  .object({
    selectedFormatId: z.string().min(1, "Please select a conversion format"),
    rotateAngle: z.enum(["90", "180", "270"]),
    pdfaVersion: z.enum(["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"]),
    password: z.string(),
    splitSpan: z.string().optional(),
    // Watermark tool — text rendered as diagonal overlay on the PDF
    watermarkText: z.string().optional(),
    // HTML-to-PDF tool — raw HTML content sent as an index.html file to Gotenberg Chromium
    htmlContent: z.string().optional(),
    // Markdown-to-PDF tool — markdown content wrapped in an HTML template for Gotenberg
    markdownContent: z.string().optional(),
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
    },
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
    },
  )
  .refine(
    (data) => {
      if (data.selectedFormatId === "watermark") {
        return Boolean(
          data.watermarkText && data.watermarkText.trim().length > 0,
        );
      }
      return true;
    },
    {
      message: "Please enter the watermark text.",
      path: ["watermarkText"],
    },
  )
  .refine(
    (data) => {
      if (data.selectedFormatId === "html-to-pdf") {
        return Boolean(data.htmlContent && data.htmlContent.trim().length > 0);
      }
      return true;
    },
    {
      message: "Please enter HTML content.",
      path: ["htmlContent"],
    },
  )
  .refine(
    (data) => {
      if (data.selectedFormatId === "markdown-to-pdf") {
        return Boolean(
          data.markdownContent && data.markdownContent.trim().length > 0,
        );
      }
      return true;
    },
    {
      message: "Please enter Markdown content.",
      path: ["markdownContent"],
    },
  );

export type PDFConverterFormValues = z.infer<typeof pdfConverterSchema>;

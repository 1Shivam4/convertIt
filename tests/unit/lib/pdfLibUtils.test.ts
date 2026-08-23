import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  rotatePDFPages,
  deletePDFPages,
  extractPDFPages,
  mergePDFDocuments,
} from "@/app/lib/pdf/pdfLibUtils";

async function createSamplePDF(pageCount = 3): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([300, 400]);
    page.drawText(`Page ${i + 1}`);
  }
  return doc.save();
}

describe("pdfLibUtils — client-side PDF operations", () => {
  it("rotates specified pages", async () => {
    const sample = await createSamplePDF(3);
    const rotatedBytes = await rotatePDFPages(sample, { 0: 90, 2: 180 });

    const doc = await PDFDocument.load(rotatedBytes);
    const pages = doc.getPages();
    expect(pages[0].getRotation().angle).toBe(90);
    expect(pages[1].getRotation().angle).toBe(0);
    expect(pages[2].getRotation().angle).toBe(180);
  });

  it("deletes specified pages", async () => {
    const sample = await createSamplePDF(3);
    const deletedBytes = await deletePDFPages(sample, [1]); // Delete 2nd page

    const doc = await PDFDocument.load(deletedBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it("extracts specified pages into a new PDF", async () => {
    const sample = await createSamplePDF(4);
    const extractedBytes = await extractPDFPages(sample, [0, 2]); // Keep pages 1 & 3

    const doc = await PDFDocument.load(extractedBytes);
    expect(doc.getPageCount()).toBe(2);
  });

  it("merges multiple PDFs into one document", async () => {
    const pdf1 = await createSamplePDF(2);
    const pdf2 = await createSamplePDF(3);

    const mergedBytes = await mergePDFDocuments([pdf1, pdf2]);
    const doc = await PDFDocument.load(mergedBytes);
    expect(doc.getPageCount()).toBe(5);
  });
});

import { PDFDocument, degrees } from "pdf-lib";

/**
 * Rotates specified pages of a PDF document.
 * @param pdfBuffer ArrayBuffer or Uint8Array of the source PDF
 * @param rotations Record mapping 0-indexed page index to rotation angle (90, 180, 270)
 */
export async function rotatePDFPages(
  pdfBuffer: ArrayBuffer | Uint8Array,
  rotations: Record<number, number>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  Object.entries(rotations).forEach(([pageIdxStr, angle]) => {
    const idx = parseInt(pageIdxStr, 10);
    if (idx >= 0 && idx < pages.length) {
      const currentRotation = pages[idx].getRotation().angle;
      pages[idx].setRotation(degrees((currentRotation + angle) % 360));
    }
  });

  return pdfDoc.save();
}

/**
 * Removes specified pages from a PDF document.
 * @param pdfBuffer ArrayBuffer or Uint8Array of the source PDF
 * @param pageIndexesToDelete Array of 0-indexed page numbers to remove
 */
export async function deletePDFPages(
  pdfBuffer: ArrayBuffer | Uint8Array,
  pageIndexesToDelete: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  // Sort indices descending so deletion doesn't shift remaining target indices
  const sortedDesc = [...new Set(pageIndexesToDelete)].sort((a, b) => b - a);

  for (const idx of sortedDesc) {
    if (idx >= 0 && idx < pdfDoc.getPageCount()) {
      pdfDoc.removePage(idx);
    }
  }

  return pdfDoc.save();
}

/**
 * Extracts specified pages from a PDF into a new PDF document.
 * @param pdfBuffer ArrayBuffer or Uint8Array of the source PDF
 * @param pageIndexesToKeep Array of 0-indexed page numbers to include
 */
export async function extractPDFPages(
  pdfBuffer: ArrayBuffer | Uint8Array,
  pageIndexesToKeep: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer);
  const newDoc = await PDFDocument.create();

  const validIndexes = pageIndexesToKeep.filter(
    (idx) => idx >= 0 && idx < srcDoc.getPageCount()
  );

  const copiedPages = await newDoc.copyPages(srcDoc, validIndexes);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return newDoc.save();
}

/**
 * Merges multiple PDF files into a single output PDF document.
 * @param pdfBuffers Array of PDF ArrayBuffers in desired order
 */
export async function mergePDFDocuments(
  pdfBuffers: (ArrayBuffer | Uint8Array)[]
): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer);
    const copiedPages = await mergedDoc.copyPages(
      srcDoc,
      srcDoc.getPageIndices()
    );
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  return mergedDoc.save();
}

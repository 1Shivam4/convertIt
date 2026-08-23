import JSZip from "jszip";

/**
 * Renders pages of a PDF document to PNG or JPEG images.
 * Returns a single image Blob (if 1 page) or a ZIP Blob containing all page images (if >1 pages).
 */
export async function renderPdfPagesToImages(
  pdfBuffer: ArrayBuffer,
  format: "png" | "jpeg" = "png",
  scale = 2.0
): Promise<{ blob: Blob; isZip: boolean }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = format === "jpeg" ? "jpg" : "png";

  const imageBlobs: { name: string; blob: Blob }[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      canvas: canvas,
      viewport: viewport,
    } as any).promise;

    const pageBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, 0.92)
    );

    if (pageBlob) {
      imageBlobs.push({
        name: `page_${i}.${ext}`,
        blob: pageBlob,
      });
    }
  }

  if (imageBlobs.length === 0) {
    throw new Error("Failed to render PDF pages to images.");
  }

  // If single page, return direct image Blob
  if (imageBlobs.length === 1) {
    return { blob: imageBlobs[0].blob, isZip: false };
  }

  // If multiple pages, package into ZIP archive using JSZip
  const zip = new JSZip();
  imageBlobs.forEach((item) => {
    zip.file(item.name, item.blob);
  });

  const zipContent = await zip.generateAsync({ type: "blob" });
  return { blob: zipContent, isZip: true };
}

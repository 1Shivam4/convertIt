"use client";

/**
 * Triggers a browser file download from a Blob or URL in a clean, isolated manner.
 */
export function triggerBrowserDownload(blobOrUrl: Blob | string, fileName: string) {
  if (typeof window === "undefined") return;

  const url =
    typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    if (typeof blobOrUrl !== "string") {
      URL.revokeObjectURL(url);
    }
  }, 100);
}

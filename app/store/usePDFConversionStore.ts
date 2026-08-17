import { create } from "zustand";

interface FileConversionProps {
  pdfOperation:
    | null
    | "compress"
    | "merge"
    | "split"
    | "compare"
    | "scan"
    | "protect"
    | "jpg"
    | "png"
    | "word"
    | "ppt"
    | "excel"
    | "html"
    | "markdown";
}

export const useFileConversion = create<FileConversionProps>((set) => ({
  pdfOperation: null,
}));

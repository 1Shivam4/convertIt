interface NavItemsProps {
  name: string;
  location: string;
  icon: string;
  description: string;
}

export interface NavbarItemsProps {
  name: string;
  icon: string;
  conversionType: "image" | "pdf" | "document" | "media" | "developer";
  itemsList: NavItemsProps[];
}

export type ConverterStage =
  | "idle"
  | "detecting"
  | "ready"
  | "converting"
  | "completed"
  | "error";

interface FileType {
  extension: string;
  mimeType: string;
}

export type DetectedFileType = FileType;

export interface ConverterState {
  stage: ConverterStage;

  file: File | null;
  sourceType: FileType | null;
  targetFormat: string | null;

  outputFile: Blob | null;
  outputFileName: string | null;
  error: string | null;

  setFile: (file: File) => void;
  setSourceType: (type: FileType) => void;
  setTargetFormat: (format: string) => void;

  startDetection: () => void;
  startConversion: () => void;
  completeConversion: (output: Blob, fileName?: string) => void;

  setError: (error: string) => void;
  reset: () => void;
  resetConversion: () => void;
}

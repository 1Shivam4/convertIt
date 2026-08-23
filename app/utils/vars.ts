import { NavbarItemsProps } from "./typeDefinitions";

export const navbarItems: NavbarItemsProps[] = [
  {
    name: "PDF",
    icon: "/icons/pdf.svg",
    conversionType: "pdf",
    itemsList: [
      {
        name: "Compress PDF",
        location: "/tools/compress-pdf",
        icon: "/icons/compress.svg",
        description: "Reduce PDF file size while keeping quality",
      },
      {
        name: "Merge PDF",
        location: "/tools/merge-pdf",
        icon: "/icons/merge-pdf.svg",
        description: "Combine multiple PDFs into one file",
      },
      {
        name: "Split PDF",
        location: "/tools/split-pdf",
        icon: "/icons/split-pdf.svg",
        description: "Extract pages into separate PDF files",
      },
      {
        name: "Compare PDF",
        location: "/tools/compare-pdf",
        icon: "/icons/compare_pdf.svg",
        description: "Compare two PDFs and highlight differences",
      },
      {
        name: "Scan to PDF",
        location: "/tools/scan-pdf",
        icon: "/icons/scan_pdf.svg",
        description: "Convert scanned images into a searchable PDF",
      },
      {
        name: "Protect PDF",
        location: "/tools/protect-pdf",
        icon: "/icons/file_lock.svg",
        description: "Add a password to secure your PDF",
      },
      {
        name: "PDF to JPG",
        location: "/tools/pdf-to-jpg",
        icon: "/icons/pdf_to_jpg.svg",
        description: "Convert PDF pages into JPG images",
      },
      {
        name: "JPG to PDF",
        location: "/tools/jpg-to-pdf",
        icon: "/icons/jpg_to_pdf.svg",
        description: "Convert JPG images into a PDF file",
      },
      {
        name: "PDF to Word",
        location: "/tools/pdf-to-word",
        icon: "/icons/pdf_to_word.svg",
        description: "Convert PDF into an editable Word document",
      },
      {
        name: "Word to PDF",
        location: "/tools/word-to-pdf",
        icon: "/icons/word_2_pdf.svg",
        description: "Convert Word documents into PDF",
      },
      {
        name: "PDF to PPT",
        location: "/tools/pdf-to-ppt",
        icon: "/icons/pdf_to_ppt.svg",
        description: "Convert PDF into a PowerPoint presentation",
      },
      {
        name: "PPT to PDF",
        location: "/tools/ppt-to-pdf",
        icon: "/icons/ppt_2_pdf.svg",
        description: "Convert PowerPoint slides into PDF",
      },
      {
        name: "PDF to Excel",
        location: "/tools/pdf-to-excel",
        icon: "/icons/pdf-to-excel.svg",
        description: "Convert PDF tables into an Excel spreadsheet",
      },
      {
        name: "Excel to PDF",
        location: "/tools/excel-to-pdf",
        icon: "/icons/excel_2_pdf.svg",
        description: "Convert Excel spreadsheets into PDF",
      },
      {
        name: "HTML to PDF",
        location: "/tools/html-to-pdf",
        icon: "/icons/html_to_pdf.svg",
        description: "Convert web pages or HTML files into PDF",
      },
      {
        name: "PDF to Markdown",
        location: "/tools/pdf-to-md",
        icon: "/icons/pdf_to_md.svg",
        description: "Convert PDF content into Markdown format",
      },
    ],
  },
  {
    name: "Image",
    icon: "/icons/png.svg",
    conversionType: "image",
    itemsList: [
      {
        name: "Compress Image",
        location: "/tools/compress-image",
        icon: "/icons/compress.svg",
        description: "Reduce image file size while keeping quality",
      },
      // PNG/JPG/WEBP/HEIC conversions go here once you have icons for them
    ],
  },
  {
    name: "Media",
    icon: "/icons/video.svg",
    conversionType: "media",
    itemsList: [
      {
        name: "Convert Video",
        location: "/tools/convert-video",
        icon: "/icons/video.svg",
        description: "Convert between video formats like MP4, MOV, MKV",
      },
    ],
  },
  {
    name: "Developer Tools",
    icon: "/icons/json.svg",
    conversionType: "developer",
    itemsList: [
      {
        name: "CSV to JSON",
        location: "/tools/csv-to-json",
        icon: "/icons/csv.svg",
        description: "Convert CSV data into JSON format",
      },
      {
        name: "JSON to YAML",
        location: "/tools/json-to-yaml",
        icon: "/icons/yaml.svg",
        description: "Convert JSON data into YAML format",
      },
    ],
  },
];

export interface PDFFormatOption {
  id: string;
  name: string;
  extension: string;
  category: "document" | "tools";
  description: string;
  iconName:
    | "FileText"
    | "FileType"
    | "FileCode"
    | "Presentation"
    | "FileSpreadsheet"
    | "Zap"
    | "Shield"
    | "RotateCw"
    | "Layers"
    | "Lock"
    | "LockOpen"
    | "Scissors"
    | "Stamp"
    | "Image";
  endpoint: string;
}

export const PDF_FORMAT_OPTIONS: PDFFormatOption[] = [
  {
    id: "docx",
    name: "Word Document",
    extension: ".docx",
    category: "document",
    description: "Convert PDF text & tables into editable Microsoft Word format",
    iconName: "FileText",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "png",
    name: "PNG Image(s)",
    extension: ".png",
    category: "document",
    description: "Export PDF pages as crisp PNG images (or ZIP archive)",
    iconName: "Image",
    endpoint: "client-side",
  },
  {
    id: "jpg",
    name: "JPG Image(s)",
    extension: ".jpg",
    category: "document",
    description: "Export PDF pages as JPEG images (or ZIP archive)",
    iconName: "Image",
    endpoint: "client-side",
  },
  {
    id: "txt",
    name: "Plain Text",
    extension: ".txt",
    category: "document",
    description: "Extract clean raw unformatted text from all PDF pages",
    iconName: "FileType",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "csv",
    name: "CSV Table",
    extension: ".csv",
    category: "document",
    description: "Extract PDF tables directly into CSV spreadsheet format",
    iconName: "FileSpreadsheet",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "html",
    name: "HTML Page",
    extension: ".zip",
    category: "document",
    description: "Convert PDF into HTML + assets (downloaded as ZIP archive)",
    iconName: "FileCode",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "md",
    name: "Markdown",
    extension: ".md",
    category: "document",
    description: "Convert PDF document to Markdown headings and text",
    iconName: "FileCode",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "pptx",
    name: "PowerPoint",
    extension: ".pptx",
    category: "document",
    description: "Convert PDF pages into editable PowerPoint slides",
    iconName: "Presentation",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "xlsx",
    name: "Excel Sheet",
    extension: ".xlsx",
    category: "document",
    description: "Extract PDF tables directly into Excel spreadsheet format",
    iconName: "FileSpreadsheet",
    endpoint: "/api/pdf/convert?target=/forms/libreoffice/convert",
  },
  {
    id: "compress",
    name: "Compress PDF",
    extension: ".pdf",
    category: "tools",
    description: "Optimize PDF structure and reduce file size",
    iconName: "Zap",
    endpoint: "/api/pdf/optimize",
  },
  {
    id: "pdfa",
    name: "PDF/A Archival",
    extension: ".pdf",
    category: "tools",
    description: "Standardize PDF for long-term ISO digital archiving",
    iconName: "Shield",
    endpoint: "/api/pdf/convert?target=/forms/pdfengines/convert",
  },
  {
    id: "rotate",
    name: "Rotate Pages",
    extension: ".pdf",
    category: "tools",
    description: "Rotate all pages by 90°, 180°, or 270° degrees",
    iconName: "RotateCw",
    endpoint: "/api/pdf/rotate",
  },
  {
    id: "flatten",
    name: "Flatten PDF",
    extension: ".pdf",
    category: "tools",
    description: "Make form fields, signatures, and annotations non-editable",
    iconName: "Layers",
    endpoint: "/api/pdf/flatten",
  },
  {
    id: "split",
    name: "Split PDF",
    extension: ".zip",
    category: "tools",
    description: "Extract specific page ranges into separate files",
    iconName: "Scissors",
    endpoint: "/api/pdf/split",
  },
  {
    id: "encrypt",
    name: "Protect PDF",
    extension: ".pdf",
    category: "tools",
    description: "Encrypt PDF with custom user password protection",
    iconName: "Lock",
    endpoint: "/api/pdf/encrypt",
  },
  {
    id: "decrypt",
    name: "Unlock PDF",
    extension: ".pdf",
    category: "tools",
    description: "Remove password protection from a PDF you own",
    iconName: "LockOpen",
    endpoint: "/api/pdf/decrypt",
  },
];

export const PDF_CATEGORIES = [
  { id: "all", label: "All Formats" },
  { id: "document", label: "Documents" },
  { id: "tools", label: "PDF Tools & Archival" },
] as const;

export const ROTATION_ANGLES = ["90", "180", "270"] as const;
export const PDFA_VERSIONS = ["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"] as const;

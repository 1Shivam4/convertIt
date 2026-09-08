import { NavbarItemsProps } from "./typeDefinitions";

export const navbarItems: NavbarItemsProps[] = [
  {
    name: "PDF",
    icon: "/icons/pdf.svg",
    conversionType: "pdf",
    itemsList: [
      {
        name: "Compress PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/compress.svg",
        description: "Reduce PDF file size while keeping quality",
      },
      {
        name: "Merge PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/merge-pdf.svg",
        description: "Combine multiple PDFs into one file",
      },
      {
        name: "Split PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/split-pdf.svg",
        description: "Extract pages into separate PDF files",
      },
      {
        name: "Protect PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/file_lock.svg",
        description: "Add a password to secure your PDF",
      },
      {
        name: "PDF to JPG",
        location: "/tools/convert-pdf",
        icon: "/icons/pdf_to_jpg.svg",
        description: "Convert PDF pages into JPG images",
      },
      {
        name: "PDF to Word",
        location: "/tools/convert-pdf",
        icon: "/icons/pdf_to_word.svg",
        description: "Convert PDF into an editable Word document",
      },
      {
        name: "Word to PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/word_2_pdf.svg",
        description: "Convert Word documents into PDF",
      },
      {
        name: "PDF to PPT",
        location: "/tools/convert-pdf",
        icon: "/icons/pdf_to_ppt.svg",
        description: "Convert PDF into a PowerPoint presentation",
      },
      {
        name: "PPT to PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/ppt_2_pdf.svg",
        description: "Convert PowerPoint slides into PDF",
      },
      {
        name: "PDF to Excel",
        location: "/tools/convert-pdf",
        icon: "/icons/pdf-to-excel.svg",
        description: "Convert PDF tables into an Excel spreadsheet",
      },
      {
        name: "Excel to PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/excel_2_pdf.svg",
        description: "Convert Excel spreadsheets into PDF",
      },
      {
        name: "HTML to PDF",
        location: "/tools/convert-pdf",
        icon: "/icons/html_to_pdf.svg",
        description: "Convert web pages or HTML files into PDF",
      },
      {
        name: "PDF to Markdown",
        location: "/tools/convert-pdf",
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
    | "Image"
    | "Droplets"
    | "FileCode"
    | "Globe";
  endpoint: string;
}

export const PDF_FORMAT_OPTIONS: PDFFormatOption[] = [
  {
    id: "docx",
    name: "Word Document",
    extension: ".docx",
    category: "document",
    description:
      "Convert PDF text & tables into editable Microsoft Word format",
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
  {
    id: "watermark",
    name: "Watermark PDF",
    extension: ".pdf",
    category: "tools",
    description: "Stamp a diagonal text watermark across every page of the PDF",
    iconName: "Droplets",
    endpoint: "/api/pdf/watermark",
  },
  {
    id: "stamp",
    name: "Stamp PDF",
    extension: ".pdf",
    category: "tools",
    description: "Overlay a stamp PDF on top of every page of the document",
    iconName: "Stamp",
    endpoint: "/api/pdf/stamp",
  },
  {
    id: "html-to-pdf",
    name: "HTML to PDF",
    extension: ".pdf",
    category: "document",
    description:
      "Convert raw HTML markup into a styled PDF via Chromium render",
    iconName: "Globe",
    endpoint: "/api/pdf/html-to-pdf",
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown to PDF",
    extension: ".pdf",
    category: "document",
    description: "Convert Markdown text into a clean, readable PDF document",
    iconName: "FileCode",
    endpoint: "/api/pdf/markdown-to-pdf",
  },
];

export const PDF_CATEGORIES = [
  { id: "all", label: "All Formats" },
  { id: "document", label: "Documents" },
  { id: "tools", label: "PDF Tools & Archival" },
] as const;

export const ROTATION_ANGLES = ["90", "180", "270"] as const;
export const PDFA_VERSIONS = ["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"] as const;

export interface ImageFormatOption {
  id: string;
  name: string;
  extension: string;
  category: "raster" | "vector" | "tools";
  description: string;
  iconName: string;
  endpoint: string;
  mimeType: string;
}

export const IMAGE_FORMAT_OPTIONS: ImageFormatOption[] = [
  {
    id: "jpg",
    name: "JPEG / JPG Image",
    extension: ".jpg",
    category: "raster",
    description: "High compatibility standard web image format",
    iconName: "Image",
    endpoint: "/api/image/convert",
    mimeType: "image/jpeg",
  },
  {
    id: "png",
    name: "PNG Image",
    extension: ".png",
    category: "raster",
    description: "Lossless image with full alpha transparency support",
    iconName: "Image",
    endpoint: "/api/image/convert",
    mimeType: "image/png",
  },
  {
    id: "webp",
    name: "WebP Image",
    extension: ".webp",
    category: "raster",
    description: "Next-gen web format with superior compression ratio",
    iconName: "Zap",
    endpoint: "/api/image/convert",
    mimeType: "image/webp",
  },
  {
    id: "avif",
    name: "AVIF Image",
    extension: ".avif",
    category: "raster",
    description: "Ultra high efficiency image format with high quality",
    iconName: "Zap",
    endpoint: "/api/image/convert",
    mimeType: "image/avif",
  },
  {
    id: "gif",
    name: "GIF Graphic",
    extension: ".gif",
    category: "raster",
    description: "Graphics interchange format for static or simple animations",
    iconName: "Film",
    endpoint: "/api/image/convert",
    mimeType: "image/gif",
  },
  {
    id: "tiff",
    name: "TIFF Document",
    extension: ".tiff",
    category: "raster",
    description: "Uncompressed high dynamic range format for printing",
    iconName: "Layers",
    endpoint: "/api/image/convert",
    mimeType: "image/tiff",
  },
  {
    id: "bmp",
    name: "BMP Bitmap",
    extension: ".bmp",
    category: "raster",
    description: "Uncompressed raster bitmap graphics format",
    iconName: "Grid",
    endpoint: "/api/image/convert",
    mimeType: "image/bmp",
  },
  {
    id: "ico",
    name: "ICO Favicon",
    extension: ".ico",
    category: "tools",
    description: "Multi-resolution Windows icon format (16x16, 32x32, 48x48)",
    iconName: "Sparkles",
    endpoint: "/api/image/ico",
    mimeType: "image/x-icon",
  },
  {
    id: "compress-image",
    name: "Compress Image",
    extension: ".jpg",
    category: "tools",
    description: "Smart image compression to reduce file size significantly",
    iconName: "Zap",
    endpoint: "/api/image/compress",
    mimeType: "image/jpeg",
  },
];

export const IMAGE_CATEGORIES = [
  { id: "all", label: "All Formats" },
  { id: "raster", label: "Raster Images" },
  { id: "tools", label: "Tools & Favicon" },
] as const;

export const IMAGE_FIT_MODES = [
  { id: "cover", label: "Cover (Crop to fill)" },
  { id: "contain", label: "Contain (Aspect fit)" },
  { id: "fill", label: "Fill (Stretch)" },
  { id: "inside", label: "Inside (Fit within bounds)" },
  { id: "outside", label: "Outside (Cover min bounds)" },
] as const;

export interface MediaFormatOption {
  id: string;
  name: string;
  extension: string;
  category: "video" | "audio" | "tools";
  description: string;
  iconName: string;
  endpoint: string;
  mimeType: string;
}

export const MEDIA_FORMAT_OPTIONS: MediaFormatOption[] = [
  {
    id: "mp4",
    name: "MP4 Video",
    extension: ".mp4",
    category: "video",
    description:
      "Universal video format with high compression and compatibility",
    iconName: "Video",
    endpoint: "/api/media/convert",
    mimeType: "video/mp4",
  },
  {
    id: "webm",
    name: "WEBM Video",
    extension: ".webm",
    category: "video",
    description: "Next-gen open video format optimized for web browsers",
    iconName: "Globe",
    endpoint: "/api/media/convert",
    mimeType: "video/webm",
  },
  {
    id: "mov",
    name: "MOV QuickTime",
    extension: ".mov",
    category: "video",
    description: "Apple QuickTime high quality video format",
    iconName: "Film",
    endpoint: "/api/media/convert",
    mimeType: "video/quicktime",
  },
  {
    id: "avi",
    name: "AVI Video",
    extension: ".avi",
    category: "video",
    description: "Standard Audio Video Interleave container format",
    iconName: "FileVideo",
    endpoint: "/api/media/convert",
    mimeType: "video/x-msvideo",
  },
  {
    id: "mkv",
    name: "MKV Matroska",
    extension: ".mkv",
    category: "video",
    description:
      "Flexible container supporting multiple audio & subtitle tracks",
    iconName: "Layers",
    endpoint: "/api/media/convert",
    mimeType: "video/x-matroska",
  },
  {
    id: "gif",
    name: "Animated GIF",
    extension: ".gif",
    category: "video",
    description: "Convert video clip into an animated GIF graphic",
    iconName: "Sparkles",
    endpoint: "/api/media/convert",
    mimeType: "image/gif",
  },
  {
    id: "mp3",
    name: "MP3 Audio",
    extension: ".mp3",
    category: "audio",
    description: "Extract or convert audio into universal MP3 format",
    iconName: "Music",
    endpoint: "/api/media/convert",
    mimeType: "audio/mpeg",
  },
  {
    id: "wav",
    name: "WAV Lossless Audio",
    extension: ".wav",
    category: "audio",
    description: "Uncompressed waveform audio format for studio quality",
    iconName: "Volume2",
    endpoint: "/api/media/convert",
    mimeType: "audio/wav",
  },
  {
    id: "aac",
    name: "AAC Audio",
    extension: ".aac",
    category: "audio",
    description:
      "Advanced Audio Coding format with superior compression efficiency",
    iconName: "Headphones",
    endpoint: "/api/media/convert",
    mimeType: "audio/aac",
  },
  {
    id: "flac",
    name: "FLAC Audio",
    extension: ".flac",
    category: "audio",
    description: "Free Lossless Audio Codec for audiophile archive quality",
    iconName: "Disc",
    endpoint: "/api/media/convert",
    mimeType: "audio/flac",
  },
  {
    id: "ogg",
    name: "OGG Vorbis Audio",
    extension: ".ogg",
    category: "audio",
    description: "Open source compressed audio stream format",
    iconName: "Radio",
    endpoint: "/api/media/convert",
    mimeType: "audio/ogg",
  },
  {
    id: "compress-video",
    name: "Compress Video",
    extension: ".mp4",
    category: "tools",
    description: "Reduce video file size using smart constant rate encoding",
    iconName: "Zap",
    endpoint: "/api/media/convert",
    mimeType: "video/mp4",
  },
];

export const MEDIA_CATEGORIES = [
  { id: "all", label: "All Media" },
  { id: "video", label: "Video Formats" },
  { id: "audio", label: "Audio Tracks" },
  { id: "tools", label: "Tools & GIF" },
] as const;

export const MEDIA_RESOLUTIONS = [
  { id: "original", label: "Original Resolution" },
  { id: "1080p", label: "1080p (Full HD 1920x1080)" },
  { id: "720p", label: "720p (HD 1280x720)" },
  { id: "480p", label: "480p (SD 854x480)" },
  { id: "360p", label: "360p (Mobile 640x360)" },
] as const;

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

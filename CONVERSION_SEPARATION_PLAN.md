# ConvertIt — Modular Domain Separation & Studio UI Architecture Plan

This document outlines the architectural blueprint, routing hierarchy, UI specifications, and conversion pipeline contracts for modularly separating the ConvertIt platform into **4 Dedicated Domain Studios** and **1 Unified Auto-Detect Landing Hub**.

---

## 1. Domain Routing Hierarchy

```
/                                   -> Unified Smart Landing & Auto-Detect Hub
/tools/pdf                          -> Dedicated Document & PDF Studio
/tools/image                        -> Dedicated Image & Graphics Hub
/tools/media                        -> Dedicated Audio & Video Studio
/tools/developer                    -> Dedicated Developer Tools & Encoders (Completed)
/dashboard                          -> Personal User Conversion History & API Keys
/dashboard/billing                  -> Razorpay Subscription Plans & Quotas
/admin                              -> Admin Operations & System Health Control Center
```

---

## 2. Studio Specifications & Conversion Engines

### 2.1 📄 Document & PDF Studio (`/tools/pdf`)
* **Core Engine**: Gotenberg 8 (Chromium + LibreOffice), `pdf-lib`, `qpdf`.
* **Dedicated UI Component**: `components/studios/PDFStudio.tsx`.
* **UI Features**:
  * **Page Manipulation Grid (`PDFPageGrid`)**: Drag-and-drop page reordering, individual page rotation buttons, page deletion, visual page range selection.
  * **Format Tiles Grid**: Grouped by Document conversions (`DOCX`, `XLSX`, `PPTX`, `EPUB`, `TXT`, `HTML`, `MD`) and Tool operations (`Encrypt`, `Decrypt`, `Rotate`, `PDF/A`, `Flatten`, `Merge`, `Split`, `Watermark`).
  * **Interactive Options Drawer**:
    * Password inputs with strength indicator for encryption/decryption.
    * PDF/A compliance standard selector (`PDF/A-1b`, `PDF/A-2b`, `PDF/A-3b`).
    * Custom text & opacity watermark configurator.
    * Live Markdown/HTML editor pane with split preview.

---

### 2.2 🖼️ Image & Graphics Hub (`/tools/image`)
* **Core Engine**: Sharp (C++ libvips) + Canvas / JSZip.
* **Dedicated UI Component**: `components/studios/ImageStudio.tsx`.
* **UI Features**:
  * **Batch Drag-and-Drop Thumbnail Grid**: Drop up to 50 images simultaneously with individual thumbnail previews, file size indicators, and per-file remove buttons.
  * **Batch Conversion Actions**: Single-click "Convert All to [Format]" with one-click `.zip` bundle download.
  * **Transform Controls Sidebar**:
    * **Target Format Selector**: `PNG`, `JPG`, `WebP`, `AVIF`, `TIFF`, `BMP`, `SVG`, `GIF`, `ICO`.
    * **Quality & Compression Slider**: 1% to 100% with live calculated estimated file size savings.
    * **Dimension Controls**: Width and Height inputs with Aspect Ratio Lock toggle (`🔒 Keep Ratio`).
    * **Fit Mode Switcher**: `Cover`, `Contain`, `Fill`, `Inside`, `Outside`.
    * **Enhancements & Filters**: Grayscale toggle, EXIF metadata stripper toggle, transparency preservation switch.

---

### 2.3 🎬 Media & Audio/Video Studio (`/tools/media`)
* **Core Engine**: FFmpeg (Subprocess worker with SSE progress & `-progress pipe:1`).
* **Dedicated UI Component**: `components/studios/MediaStudio.tsx`.
* **UI Features**:
  * **Video Player Preview & Timeline Scrubber**: HTML5 video playback with interactive start/end time sliders for visual trimming.
  * **Format Selectors**:
    * **Video Targets**: `MP4` (H.264), `WebM` (VP9), `MKV`, `AVI`, `MOV`, `FLV`, `WMV`.
    * **Audio Extraction Targets**: `MP3`, `WAV`, `AAC`, `FLAC`, `OGG`, `M4A`, `WMA`.
    * **GIF Generator**: High-framerate looping GIF maker (capped at 15s).
  * **Encoding Parameters**:
    * **Resolution Presets**: Original, `1080p Full HD`, `720p HD`, `480p SD`, `360p Mobile`.
    * **Video Bitrate**: Auto, `1 Mbps`, `2.5 Mbps`, `5 Mbps`, `8 Mbps`.
    * **Audio Bitrate**: Auto, `128 kbps`, `192 kbps`, `320 kbps High Fidelity`.
    * **Playback Controls**: Speed adjustment (`0.5x`, `1x`, `1.5x`, `2x`), Audio Mute toggle.
  * **Real-time Transcoding Progress**: Live percentage bar, current processing FPS, and encoding speed multiplier.

---

### 2.4 🛠️ Developer Tools Hub (`/tools/developer`)
* **Status**: **Completed & Verified**.
* **Engine**: Pure in-memory Web APIs & pure TypeScript functions.
* **Component**: `components/DevToolsWorkspace.tsx`.
* **Tabs**:
  1. JSON ⇋ YAML Converter
  2. CSV ⇋ JSON Converter
  3. Base64 Text/Binary Encoder & Decoder
  4. URL Component Encoder & Decoder
  5. Cryptographic Hasher (MD5, SHA-1, SHA-256, SHA-512)

---

### 2.5 🌐 Unified Smart Auto-Detect Landing Hub (`/`)
* **Dedicated UI Component**: `app/(public)/page.tsx`.
* **Features**:
  * **Universal Auto-Detect Dropzone**: Automatically inspects dropped file MIME types:
    * Dropped `.pdf` / `.docx` $\rightarrow$ Suggests PDF/Doc conversions with one-click jump to PDF Studio.
    * Dropped `.png` / `.jpg` $\rightarrow$ Suggests Image conversions with batch adder and one-click jump to Image Hub.
    * Dropped `.mp4` / `.mov` $\rightarrow$ Suggests Video/Audio conversions with one-click jump to Media Studio.
  * **Studio Cards**: Interactive feature cards showcasing each domain with direct navigation.
  * **Live Engine Status Badge**: Gotenberg, Sharp, and FFmpeg health indicators.

---

## 3. Directory & File Structure Blueprint

```
convert-it/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                           # Universal Smart Hub
│   │   └── tools/
│   │       ├── pdf/page.tsx                   # PDF Studio Page
│   │       ├── image/page.tsx                 # Image Hub Page
│   │       ├── media/page.tsx                 # Media Studio Page
│   │       └── developer/page.tsx             # Developer Tools Page
│   ├── api/
│   │   ├── pdf/                               # PDF Routes (Gotenberg / PDF-Lib)
│   │   ├── image/                             # Image Routes (Sharp)
│   │   ├── media/                             # Media Routes (FFmpeg)
│   │   └── jobs/[id]/                         # Async BullMQ Polling & Download
├── components/
│   ├── studios/
│   │   ├── PDFStudio.tsx                      # PDF Workspace
│   │   ├── ImageStudio.tsx                    # Image Workspace & Batch Grid
│   │   ├── MediaStudio.tsx                    # Video/Audio Workspace & Trimmer
│   │   └── DevToolsWorkspace.tsx              # Developer Tools Workspace
│   └── shared/
│       ├── UniversalDropzone.tsx              # Shared Drag-and-drop
│       └── ConversionProgressCard.tsx         # Unified progress state
```

---

## 4. Execution Sequence (When Ready to Implement)

1. **Phase 1: Shared Core & Routing Shells**:
   - Create route shells: `app/(public)/tools/pdf/page.tsx`, `image/page.tsx`, `media/page.tsx`.
   - Update navigation headers and footer links.
2. **Phase 2: PDF Studio Migration**:
   - Refactor `PDFToConvertor.tsx` into clean `components/studios/PDFStudio.tsx`.
3. **Phase 3: Image Studio & Batch Experience**:
   - Build `components/studios/ImageStudio.tsx` with multi-file grid and live compression slider.
4. **Phase 4: Media Studio & Timeline Trimmer**:
   - Build `components/studios/MediaStudio.tsx` with video player preview and audio extraction controls.
5. **Phase 5: Universal Landing Hub Refinement**:
   - Update `app/(public)/page.tsx` with the smart MIME router and studio showcase cards.

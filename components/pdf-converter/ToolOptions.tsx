"use client";

import { UseFormRegister, FieldErrors, UseFormSetValue } from "react-hook-form";
import { PDFConverterFormValues } from "@/app/lib/schemas/pdfConverterSchema";
import { ROTATION_ANGLES, PDFA_VERSIONS } from "@/app/utils/vars";

interface ToolOptionsProps {
  selectedFormatId: string;
  register: UseFormRegister<PDFConverterFormValues>;
  errors: FieldErrors<PDFConverterFormValues>;
  setValue: UseFormSetValue<PDFConverterFormValues>;
  watchRotateAngle: string;
  watchPdfaVersion: string;
  disabled?: boolean;
}

export default function ToolOptions({
  selectedFormatId,
  register,
  errors,
  setValue,
  watchRotateAngle,
  watchPdfaVersion,
  disabled = false,
}: ToolOptionsProps) {
  if (selectedFormatId === "rotate") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Select Rotation Angle:
        </label>
        <div className="flex gap-2">
          {ROTATION_ANGLES.map((angle) => (
            <button
              key={angle}
              type="button"
              disabled={disabled}
              onClick={() => setValue("rotateAngle", angle as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                watchRotateAngle === angle
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {angle}° Clockwise
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (selectedFormatId === "pdfa") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Select PDF/A ISO Standard:
        </label>
        <div className="flex gap-2">
          {PDFA_VERSIONS.map((ver) => (
            <button
              key={ver}
              type="button"
              disabled={disabled}
              onClick={() => setValue("pdfaVersion", ver as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                watchPdfaVersion === ver
                  ? "bg-red-600 text-white border-red-500"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              {ver}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (selectedFormatId === "encrypt") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Enter Password to Secure PDF:
        </label>
        <input
          type="password"
          disabled={disabled}
          placeholder="Enter protective password..."
          {...register("password")}
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        {errors.password && (
          <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
        )}
      </div>
    );
  }

  if (selectedFormatId === "decrypt") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Enter Current PDF Password:
          </label>
          <input
            type="password"
            disabled={disabled}
            placeholder="Enter existing password to unlock..."
            {...register("password")}
            className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>
        <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-lg">
          <span className="text-amber-400 text-xs shrink-0 mt-0.5">⚠</span>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Only unlock PDFs you own or have explicit permission to modify.
          </p>
        </div>
      </div>
    );
  }

  if (selectedFormatId === "split") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Enter Page Range to Extract (e.g. 1-3, 5):
        </label>
        <input
          type="text"
          disabled={disabled}
          placeholder="e.g. 1-3, 5, 8-10..."
          {...register("splitSpan")}
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        {errors.splitSpan && (
          <p className="text-xs text-red-400 mt-1">
            {errors.splitSpan.message}
          </p>
        )}
      </div>
    );
  }

  if (selectedFormatId === "watermark") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Watermark Text:
        </label>
        <input
          type="text"
          disabled={disabled}
          placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY..."
          {...register("watermarkText")}
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        {errors.watermarkText && (
          <p className="text-xs text-red-400 mt-1">
            {errors.watermarkText.message}
          </p>
        )}
        <p className="text-[11px] text-slate-500">
          Text will be rendered as a diagonal watermark across every page.
        </p>
      </div>
    );
  }

  if (selectedFormatId === "stamp") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3">
        <div className="flex items-start gap-2 p-2.5 bg-blue-500/10 border border-blue-500/25 rounded-lg">
          <span className="text-blue-400 text-xs shrink-0 mt-0.5">ℹ</span>
          <p className="text-xs text-blue-200/80 leading-relaxed">
            Upload a <span className="font-semibold text-white">stamp PDF</span>{" "}
            — it will be overlaid on every page of your base PDF via Gotenberg.
          </p>
        </div>
        <label className="block text-xs font-semibold text-slate-300">
          Stamp PDF File:
        </label>
        <input
          type="file"
          accept=".pdf,application/pdf"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setValue("stampFile" as any, f);
          }}
          className="w-full text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-500 cursor-pointer"
        />
      </div>
    );
  }

  if (selectedFormatId === "html-to-pdf") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          HTML Content:
        </label>
        <textarea
          disabled={disabled}
          placeholder={
            "<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>"
          }
          {...register("htmlContent")}
          rows={8}
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 resize-y"
        />
        {errors.htmlContent && (
          <p className="text-xs text-red-400 mt-1">
            {errors.htmlContent.message}
          </p>
        )}
        <p className="text-[11px] text-slate-500">
          Paste full HTML — Chromium renders it to PDF. No file upload needed.
        </p>
      </div>
    );
  }

  if (selectedFormatId === "markdown-to-pdf") {
    return (
      <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300">
          Markdown Content:
        </label>
        <textarea
          disabled={disabled}
          placeholder={
            "# My Document\n\n## Introduction\n\nWrite your **markdown** here...\n\n- Item 1\n- Item 2"
          }
          {...register("markdownContent")}
          rows={8}
          className="w-full bg-[#0b0d11] border border-white/15 focus:border-red-500 rounded-lg px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-red-500 resize-y"
        />
        {errors.markdownContent && (
          <p className="text-xs text-red-400 mt-1">
            {errors.markdownContent.message}
          </p>
        )}
        <p className="text-[11px] text-slate-500">
          Markdown is wrapped in an HTML template and rendered by Chromium. No
          file upload needed.
        </p>
      </div>
    );
  }

  return null;
}

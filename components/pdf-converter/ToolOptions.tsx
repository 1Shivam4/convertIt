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

  return null;
}

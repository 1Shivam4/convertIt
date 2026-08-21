"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownLeft } from "lucide-react";

import { useConverterStore } from "@/app/store/useFileDetectionStore";
import { PDF_FORMAT_OPTIONS } from "@/app/utils/vars";
import {
  pdfConverterSchema,
  PDFConverterFormValues,
} from "@/app/lib/schemas/pdfConverterSchema";

import PDFPreview from "./pdf-converter/PDFPreview";
import FormatSelector from "./pdf-converter/FormatSelector";
import ToolOptions from "./pdf-converter/ToolOptions";
import ConversionStatus from "./pdf-converter/ConversionStatus";

export default function PDFToConvertor() {
  const {
    file,
    stage,
    outputFile,
    outputFileName,
    error,
    startConversion,
    completeConversion,
    setError,
    reset,
    resetConversion,
  } = useConverterStore();

  const [activeCategory, setActiveCategory] = useState<"all" | "document" | "tools">("all");
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PDFConverterFormValues>({
    resolver: zodResolver(pdfConverterSchema),
    defaultValues: {
      selectedFormatId: "docx",
      rotateAngle: "90",
      pdfaVersion: "PDF/A-1b",
      password: "",
    },
  });

  const selectedFormatId = watch("selectedFormatId");
  const watchRotateAngle = watch("rotateAngle");
  const watchPdfaVersion = watch("pdfaVersion");

  const selectedFormat = useMemo(() => {
    return (
      PDF_FORMAT_OPTIONS.find((f) => f.id === selectedFormatId) ||
      PDF_FORMAT_OPTIONS[0]
    );
  }, [selectedFormatId]);

  const handleCancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setError("Conversion canceled by user.");
  }, [setError]);

  const onSubmit = useCallback(
    async (values: PDFConverterFormValues) => {
      if (!file) return;

      startConversion();

      // Setup AbortController for cancel capability
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const formData = new FormData();
        formData.append("files", file, file.name);

        const targetFormatDef =
          PDF_FORMAT_OPTIONS.find((f) => f.id === values.selectedFormatId) ||
          selectedFormat;

        let url = targetFormatDef.endpoint;

        // Custom parameter attachments
        if (values.selectedFormatId === "rotate") {
          formData.append("rotateAngle", values.rotateAngle);
        } else if (values.selectedFormatId === "encrypt") {
          formData.append("userPassword", values.password || "");
          formData.append("ownerPassword", values.password || "");
        } else if (values.selectedFormatId === "decrypt") {
          formData.append("password", values.password || "");
        } else if (values.selectedFormatId === "pdfa") {
          formData.append("pdfa", values.pdfaVersion);
        }

        const response = await fetch(url, {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errText = await response
            .text()
            .catch(() => "Conversion failed");
          throw new Error(
            errText || `Server responded with status ${response.status}`
          );
        }

        const resultBlob = await response.blob();

        const baseName =
          file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        let outExt = targetFormatDef.extension;
        if (
          ["rotate", "compress", "flatten", "encrypt", "decrypt", "pdfa"].includes(
            values.selectedFormatId
          )
        ) {
          outExt = `_${values.selectedFormatId}.pdf`;
        }
        const finalFileName = `${baseName}${outExt}`;

        completeConversion(resultBlob, finalFileName);
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.warn("PDF Conversion fetch aborted.");
          return;
        }
        console.error("PDF conversion error:", err);
        setError(
          err?.message || "Failed to convert file. Please check server status."
        );
      } finally {
        abortControllerRef.current = null;
      }
    },
    [file, selectedFormat, startConversion, completeConversion, setError]
  );

  const handleCategoryChange = useCallback(
    (category: "all" | "document" | "tools") => {
      setActiveCategory(category);
    },
    []
  );

  const handleSelectFormat = useCallback(
    (id: string) => {
      setValue("selectedFormatId", id);
    },
    [setValue]
  );

  // Global Enter Key Listener to trigger conversion submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Enter" &&
        (stage === "ready" || stage === "error") &&
        file
      ) {
        const activeElem = document.activeElement;
        const isPasswordInput =
          activeElem?.getAttribute("type") === "password";
        if (!isPasswordInput) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [stage, file, handleSubmit, onSubmit]);

  if (!file) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 relative z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: PDF Document Preview */}
        <div className="lg:col-span-6">
          <PDFPreview file={file} onReset={reset} />
        </div>

        {/* RIGHT COLUMN: Conversion Form Controls */}
        <div className="lg:col-span-6 bg-[#131722]/90 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-2xl flex flex-col justify-between min-h-[664px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col justify-between h-full space-y-6"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                    Target Format
                  </span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    Convert PDF Document
                  </h3>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10">
                  <CornerDownLeft className="w-3.5 h-3.5 text-slate-300" />
                  <span>Press </span>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono text-[10px] text-white">
                    Enter
                  </kbd>
                  <span> to convert</span>
                </div>
              </div>

              {/* Format Selection Component */}
              <FormatSelector
                selectedFormatId={selectedFormatId}
                activeCategory={activeCategory}
                disabled={stage === "converting"}
                onSelectFormat={handleSelectFormat}
                onCategoryChange={handleCategoryChange}
              />

              {/* Tool Options Component */}
              <div className="mt-4">
                <ToolOptions
                  selectedFormatId={selectedFormatId}
                  register={register}
                  errors={errors}
                  setValue={setValue}
                  watchRotateAngle={watchRotateAngle}
                  watchPdfaVersion={watchPdfaVersion}
                  disabled={stage === "converting"}
                />
              </div>
            </div>

            {/* Conversion Actions & Status Component */}
            <div className="pt-4 border-t border-white/10">
              <ConversionStatus
                stage={stage}
                formatName={selectedFormat.name}
                formatExtension={selectedFormat.extension}
                outputFile={outputFile}
                outputFileName={outputFileName}
                error={error}
                onConvertSubmit={handleSubmit(onSubmit)}
                onCancelRequest={handleCancelRequest}
                onResetConversion={resetConversion}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

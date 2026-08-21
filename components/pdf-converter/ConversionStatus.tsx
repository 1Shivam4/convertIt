"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { ConverterStage } from "@/app/utils/typeDefinitions";

interface ConversionStatusProps {
  stage: ConverterStage;
  formatName: string;
  formatExtension: string;
  outputFile: Blob | null;
  outputFileName: string | null;
  error: string | null;
  onConvertSubmit: () => void;
  onCancelRequest: () => void;
  onResetConversion: () => void;
}

export default function ConversionStatus({
  stage,
  formatName,
  formatExtension,
  outputFile,
  outputFileName,
  error,
  onConvertSubmit,
  onCancelRequest,
  onResetConversion,
}: ConversionStatusProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!outputFile) {
      setDownloadUrl(null);
      return;
    }
    const url = URL.createObjectURL(outputFile);
    setDownloadUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [outputFile]);

  const outputName = useMemo(() => {
    return outputFileName || `converted${formatExtension}`;
  }, [outputFileName, formatExtension]);

  if (stage === "converting") {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div>
          <h4 className="text-base font-bold text-white">
            Converting document...
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Converting PDF to {formatName} ({formatExtension})
          </p>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-400 h-full w-3/4 animate-pulse rounded-full" />
        </div>
        <button
          type="button"
          onClick={onCancelRequest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          Cancel Conversion
        </button>
      </div>
    );
  }

  if (stage === "completed" && outputFile) {
    return (
      <div className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base font-bold text-white">
              Conversion Complete!
            </h4>
            <p className="text-xs text-slate-300 truncate max-w-xs">
              {outputName}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={outputName}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-green-600/30 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Download File
            </a>
          )}
          <button
            type="button"
            onClick={onResetConversion}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold py-3 px-4 rounded-xl border border-white/10 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Convert Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stage === "error" && error && (
        <div className="p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-300">Conversion Failed</p>
            <p className="mt-0.5 text-slate-300 break-words">{error}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onConvertSubmit}
        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-base py-3.5 px-6 rounded-xl shadow-xl shadow-red-600/30 transition-all group duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <span>Convert to {formatName}</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}

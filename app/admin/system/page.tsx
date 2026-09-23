"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  Database,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Server,
  Terminal,
} from "lucide-react";

export default function AdminSystemPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system");
      const json = await res.json();
      if (json.success) {
        setDiagnostics(json.diagnostics);
      }
    } catch (err) {
      console.error("Failed to load diagnostics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Engine Diagnostics & Infrastructure</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time latency metrics, conversion microservice availability, and host server vitals.
          </p>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
          Run Health Diagnostics
        </button>
      </div>

      {/* Host System Vitals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-400" /> Host OS & Arch
          </div>
          <div className="text-base font-bold text-white uppercase">
            {diagnostics?.system?.platform || "..."} ({diagnostics?.system?.arch || "..."})
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" /> Total RAM
          </div>
          <div className="text-base font-bold text-white">
            {diagnostics?.system?.totalMemoryMB ? `${(diagnostics.system.totalMemoryMB / 1024).toFixed(1)} GB` : "..."}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Free Memory
          </div>
          <div className="text-base font-bold text-emerald-400">
            {diagnostics?.system?.freeMemoryMB ? `${(diagnostics.system.freeMemoryMB / 1024).toFixed(1)} GB` : "..."}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-amber-400" /> Host Uptime
          </div>
          <div className="text-base font-bold text-white">
            {diagnostics?.system?.uptimeHours ? `${diagnostics.system.uptimeHours} hrs` : "..."}
          </div>
        </div>
      </div>

      {/* Conversion Engine Diagnostic Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* PostgreSQL Database */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Database className="w-4 h-4 text-blue-400" />
              PostgreSQL Database
            </div>
            {diagnostics?.engines?.database?.status === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> ONLINE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> OFFLINE
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Engine: <strong>Prisma 7 (Local pg pool)</strong></div>
            <div>Ping Latency: <strong className="text-emerald-400 font-mono">{diagnostics?.engines?.database?.latencyMs ?? 0} ms</strong></div>
          </div>
        </div>

        {/* Redis Cluster */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Layers className="w-4 h-4 text-rose-400" />
              Redis & BullMQ
            </div>
            {diagnostics?.engines?.redis?.status === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> CONNECTED
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> DEGRADED
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Driver: <strong>ioredis v6 (BullMQ 6)</strong></div>
            <div>Roundtrip Latency: <strong className="text-emerald-400 font-mono">{diagnostics?.engines?.redis?.latencyMs ?? 0} ms</strong></div>
          </div>
        </div>

        {/* Gotenberg Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Gotenberg 8 Container
            </div>
            {diagnostics?.engines?.gotenberg?.status === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> HEALTHY
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> RECONNECTING
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Modules: <strong>Chromium, LibreOffice, PDFEngines</strong></div>
            <div>Endpoint: <strong className="font-mono text-[11px]">{diagnostics?.engines?.gotenberg?.url || "localhost:3000"}</strong></div>
          </div>
        </div>

        {/* FFmpeg Video Engine */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <Terminal className="w-4 h-4 text-amber-400" />
              FFmpeg Transcoding
            </div>
            {diagnostics?.engines?.ffmpeg?.status === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> AVAILABLE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                STATIC FALLBACK
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Package: <strong>ffmpeg-static (H.264, VP9, MP3)</strong></div>
            <div>CLI Status: <strong>{diagnostics?.engines?.ffmpeg?.version || "Embedded runtime"}</strong></div>
          </div>
        </div>

        {/* Sharp Image Pipeline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              Sharp (libvips)
            </div>
            {diagnostics?.engines?.sharp?.status === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> READY
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> ERROR
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Formats: <strong>WebP, AVIF, PNG, JPEG, TIFF</strong></div>
            <div>SIMD Acceleration: <strong className="text-emerald-400">Enabled</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

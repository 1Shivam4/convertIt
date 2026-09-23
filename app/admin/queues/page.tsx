"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
} from "lucide-react";

export default function AdminQueuesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/queues");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load queue status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleQueueAction = async (action: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: "success", msg: json.message });
        fetchQueues();
      } else {
        throw new Error(json.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BullMQ Conversion Queues</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time worker concurrency, queue load distribution, and background execution management.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchQueues}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Queue State Banner & Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              data?.isPaused ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"
            }`}
          />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider">
              Queue Status: {data?.isPaused ? "PAUSED" : "ACTIVE & ACCEPTING JOBS"}
            </div>
            <div className="text-[11px] text-slate-400">
              Target Redis Cluster: ioredis @ localhost:6379
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {data?.isPaused ? (
            <button
              onClick={() => handleQueueAction("resume")}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5" /> Resume Processing
            </button>
          ) : (
            <button
              onClick={() => handleQueueAction("pause")}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" /> Pause Queue
            </button>
          )}

          <button
            onClick={() => handleQueueAction("retry_all_failed")}
            disabled={actionLoading || !data?.counts?.failed}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Retry All Failed
          </button>

          <button
            onClick={() => handleQueueAction("clean_failed")}
            disabled={actionLoading || !data?.counts?.failed}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clean Failed
          </button>
        </div>
      </div>

      {/* Queue Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Waiting</div>
          <div className="text-2xl font-bold text-amber-400">{data?.counts?.waiting ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Now</div>
          <div className="text-2xl font-bold text-blue-400">{data?.counts?.active ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Delayed</div>
          <div className="text-2xl font-bold text-purple-400">{data?.counts?.delayed ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed</div>
          <div className="text-2xl font-bold text-emerald-400">{data?.counts?.completed ?? 0}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Failed</div>
          <div className="text-2xl font-bold text-rose-400">{data?.counts?.failed ?? 0}</div>
        </div>
      </div>

      {/* Failed Jobs Error Stack Inspector */}
      {data?.jobs?.failed?.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-3 p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Failed Queue Jobs ({data.jobs.failed.length})
          </div>

          <div className="space-y-3">
            {data.jobs.failed.map((j: any) => (
              <div key={j.id} className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">Job ID: {j.id}</span>
                  <span className="text-[10px] text-slate-500">{new Date(j.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-xs text-rose-300 font-medium">
                  {j.failedReason || "Unknown failure reason"}
                </div>
                {j.stacktrace && j.stacktrace.length > 0 && (
                  <pre className="p-3 bg-slate-900 rounded-lg text-[11px] text-slate-400 font-mono overflow-x-auto max-h-32">
                    {j.stacktrace.join("\n")}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

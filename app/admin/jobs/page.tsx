"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/jobs?${params}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load conversion jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleRetryJob = async (jobId: string) => {
    setRetryingId(jobId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", msg: data.message });
        fetchJobs();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conversion Job Logs</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Audit all asynchronous and synchronous document transformations, failure outputs, and re-enqueue jobs.
          </p>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
          Refresh Logs
        </button>
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

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Job ID, source format, or user email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-rose-500 w-full md:w-auto"
        >
          <option value="">All Statuses</option>
          <option value="COMPLETED">Completed</option>
          <option value="PROCESSING">Processing</option>
          <option value="QUEUED">Queued</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Jobs Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Conversion Flow</th>
                <th className="py-3 px-4">Engine</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading conversion logs...</div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No conversion jobs found.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const conv = job.conversions?.[0];
                  return (
                    <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {job.id.substring(0, 12)}...
                      </td>

                      <td className="py-3.5 px-4">
                        {job.user ? (
                          <div>
                            <div className="font-medium text-white">{job.user.name || "User"}</div>
                            <div className="text-[11px] text-slate-500">{job.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Guest User</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {job.sourceFormat}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20 uppercase">
                            {job.targetFormat}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {conv?.engine || "gotenberg"}
                      </td>

                      <td className="py-3.5 px-4">
                        {job.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> Completed
                          </span>
                        )}
                        {job.status === "PROCESSING" && (
                          <span className="inline-flex items-center gap-1 text-amber-400 text-[11px]">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> Processing
                          </span>
                        )}
                        {job.status === "QUEUED" && (
                          <span className="inline-flex items-center gap-1 text-blue-400 text-[11px]">
                            <Clock className="w-3.5 h-3.5" /> Queued
                          </span>
                        )}
                        {job.status === "FAILED" && (
                          <button
                            onClick={() => setSelectedError(conv?.error || "Conversion failed with unknown error")}
                            className="inline-flex items-center gap-1 text-rose-400 text-[11px] hover:underline"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Failed (View Log)
                          </button>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {job.status === "FAILED" && (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            disabled={retryingId === job.id}
                            className="px-2.5 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors"
                          >
                            <RotateCcw className={`w-3 h-3 ${retryingId === job.id ? "animate-spin" : ""}`} />
                            Retry
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Page {page} of {totalPages || 1}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-40 hover:bg-slate-800 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Error Output Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-4 h-4" />
                Conversion Engine Error Log
              </h3>
              <button onClick={() => setSelectedError(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl text-xs font-mono text-rose-300 border border-rose-500/20 overflow-x-auto max-h-64 whitespace-pre-wrap">
              {selectedError}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedError(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

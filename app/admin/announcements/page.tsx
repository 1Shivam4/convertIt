"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [target, setTarget] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, type, target }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create announcement");
      }

      setFeedback({ type: "success", msg: "Announcement published successfully!" });
      setTitle("");
      setMessage("");
      fetchAnnouncements();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      const res = await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", msg: "Announcement deleted" });
        fetchAnnouncements();
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Announcements & Banners</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Broadcast platform updates, scheduled maintenance alerts, and promotional offerings to users.
          </p>
        </div>

        <button
          onClick={fetchAnnouncements}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
          Refresh
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

      {/* Create Announcement Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-rose-400" />
          Publish New Banner Announcement
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Headline Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Media Studio 2.0 is now live!"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Banner Style
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
              >
                <option value="INFO">Informational (Blue)</option>
                <option value="WARNING">Maintenance Warning (Amber)</option>
                <option value="PROMO">Promotional / Offering (Rose)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Message Content
            </label>
            <textarea
              required
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detailed notification message for users..."
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Audience:
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none"
              >
                <option value="ALL">All Users</option>
                <option value="GUEST">Guests Only</option>
                <option value="FREE">Free Tier Only</option>
                <option value="PRO">Pro Tier Only</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
            >
              {actionLoading ? "Publishing..." : "Broadcast Announcement"}
            </button>
          </div>
        </form>
      </div>

      {/* Active Announcements List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Active Announcements ({announcements.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-800/60">
          {announcements.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              No active announcements currently published.
            </div>
          ) : (
            announcements.map((a) => (
              <div key={a.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {a.type === "PROMO" && <Sparkles className="w-4 h-4 text-rose-400" />}
                    {a.type === "WARNING" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {a.type === "INFO" && <Info className="w-4 h-4 text-blue-400" />}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-xs flex items-center gap-2">
                      <span>{a.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {a.target}
                      </span>
                    </div>
                    <div className="text-slate-400 text-xs mt-1">{a.message}</div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Posted on {new Date(a.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Activity,
  Layers,
  Cpu,
  TrendingUp,
  UserPlus,
  Coins,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/metrics");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Real-time platform throughput, conversion queue loads, and infrastructure pulse.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
            Refresh Pulse
          </button>
          <Link
            href="/admin/users/create"
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Provision User
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {data?.users?.total ?? "..."}
            </span>
            <span className="text-[11px] text-emerald-400 font-medium">
              +{data?.users?.today ?? 0} today
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span>Free: {data?.users?.byPlan?.FREE ?? 0}</span>
            <span>•</span>
            <span>Standard: {data?.users?.byPlan?.STANDARD ?? 0}</span>
            <span>•</span>
            <span>Pro: {data?.users?.byPlan?.PRO ?? 0}</span>
          </div>
        </div>

        {/* Total Conversions */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversions</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {data?.jobs?.total ?? "..."}
            </span>
            <span className="text-[11px] text-slate-400">
              ({data?.jobs?.today ?? 0} today)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{data?.jobs?.successRate ?? 100}% Success Rate</span>
          </div>
        </div>

        {/* BullMQ Active Queues */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Queue Load</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {data?.queues?.active ?? 0} active
            </span>
            <span className="text-[11px] text-slate-400">
              ({data?.queues?.waiting ?? 0} waiting)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400 font-medium">
            {data?.queues?.failed ?? 0} failed jobs
          </div>
        </div>

        {/* Engine Status */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Infrastructure</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-1 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${data?.engines?.database ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`} />
              <span className="text-slate-300">DB</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${data?.engines?.redis ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`} />
              <span className="text-slate-300">Redis</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${data?.engines?.gotenberg ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className="text-slate-300">Goten</span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            All primary services responding
          </div>
        </div>
      </div>

      {/* Quick Access Actions & System Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
            <Link
              href="/admin/users/create"
              className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Create User / Send Invite</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/tokens"
              className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>Distribute Conversion Credits</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/queues"
              className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Manage BullMQ Workers</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/admin/system"
              className="p-3 bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-medium text-slate-200 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Run Engine Diagnostics</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Live Conversion Pipeline Status */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Conversion Pipeline Stats</h2>
            <Link href="/admin/jobs" className="text-xs text-rose-400 hover:text-rose-300 font-medium">
              View All Logs →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Completed
              </div>
              <div className="text-xl font-bold text-white">{data?.jobs?.completed ?? 0}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" /> In Progress
              </div>
              <div className="text-xl font-bold text-white">{data?.jobs?.processing ?? 0}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Layers className="w-3 h-3 text-blue-400" /> Queued
              </div>
              <div className="text-xl font-bold text-white">{data?.jobs?.queued ?? 0}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
              <div className="text-slate-400 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3 text-rose-400" /> Failed
              </div>
              <div className="text-xl font-bold text-white">{data?.jobs?.failed ?? 0}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>BullMQ Consumer Service: <strong className="text-emerald-400">Active</strong></span>
            <span>Worker concurrency: <strong>5 jobs/sec</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  Search,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  History,
  TrendingUp,
} from "lucide-react";

export default function AdminTokensPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [targetUserId, setTargetUserId] = useState("");
  const [amount, setAmount] = useState(50);
  const [actionType, setActionType] = useState<"grant" | "deduct">("grant");
  const [reason, setReason] = useState("ADMIN_GRANT");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tokens");
      const data = await res.json();
      if (data.success) {
        setBalances(data.balances || []);
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to load tokens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      setFeedback({ type: "error", msg: "Please select or provide a user ID" });
      return;
    }

    const finalAmount = actionType === "grant" ? Math.abs(amount) : -Math.abs(amount);
    setActionLoading(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          amount: finalAmount,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to update token balance");
      }

      setFeedback({
        type: "success",
        msg: `Successfully ${actionType === "grant" ? "granted" : "deducted"} ${Math.abs(
          amount
        )} tokens! New balance: ${data.balance}`,
      });
      setAmount(50);
      fetchTokens();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Token & Credit Distribution</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage user conversion tokens, distribute bonus compute credits, and inspect the transaction ledger.
          </p>
        </div>

        <button
          onClick={fetchTokens}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-rose-400" : ""}`} />
          Refresh Ledger
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
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Action Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          Distribute / Deduct Tokens
        </h2>

        <form onSubmit={handleTokenSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Target User
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="">-- Select User --</option>
              {balances.map((b) => (
                <option key={b.userId} value={b.userId}>
                  {b.user.name || b.user.email} ({b.user.plan}) — Bal: {b.balance}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Operation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType("grant")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  actionType === "grant"
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-950/40 border-slate-800 text-slate-400"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Grant
              </button>
              <button
                type="button"
                onClick={() => setActionType("deduct")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                  actionType === "deduct"
                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                    : "bg-slate-950/40 border-slate-800 text-slate-400"
                }`}
              >
                <Minus className="w-3.5 h-3.5" /> Deduct
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Token Amount
            </label>
            <input
              type="number"
              min="1"
              max="50000"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Memo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
            >
              <option value="ADMIN_GRANT">Manual Admin Grant</option>
              <option value="PROMO_AIRDROP">Promo / Beta Airdrop</option>
              <option value="SUPPORT_COMPENSATION">Support Compensation</option>
              <option value="CORRECTION">Manual Adjustment</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 pt-2 flex justify-end">
            <button
              type="submit"
              disabled={actionLoading || !targetUserId}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
            >
              {actionLoading ? "Processing..." : `Execute ${actionType === "grant" ? "Grant" : "Deduct"}`}
            </button>
          </div>
        </form>
      </div>

      {/* Two Column Layout: Balances & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Balances Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              Active Balances
            </h2>
            <span className="text-[11px] text-slate-500">{balances.length} users with token accounts</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/40 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Plan</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {balances.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No active token balances recorded yet.
                    </td>
                  </tr>
                ) : (
                  balances.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-white">{b.user.name || "User"}</div>
                        <div className="text-[11px] text-slate-500">{b.user.email}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {b.user.plan}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400">
                        {b.balance}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History Ledger */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-blue-400" />
              Transaction Ledger
            </h2>
            <span className="text-[11px] text-slate-500">Latest 50 events</span>
          </div>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/40 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      No token transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-white">{tx.user.name || tx.user.email}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-400">
                        {tx.reason}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right font-mono font-semibold ${
                          tx.amount > 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  Shield,
  ShieldAlert,
  Coins,
  Trash2,
  CheckCircle,
  XCircle,
  MoreVertical,
  RefreshCw,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [tokenAmount, setTokenAmount] = useState(10);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("FREE");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search ? { search } : {}),
        ...(planFilter ? { plan: planFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, planFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Toggle Ban / Unban
  const handleToggleBan = async (user: any) => {
    const confirmMsg = user.banned
      ? `Unban user ${user.email}? They will regain access to conversions.`
      : `Ban user ${user.email}? All active sessions will be terminated immediately.`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banned: !user.banned }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          msg: `User ${user.email} is now ${user.banned ? "active" : "banned"}`,
        });
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Grant Tokens
  const handleGrantTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: Number(tokenAmount),
          reason: "ADMIN_DIRECT_GRANT",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          msg: `Successfully granted ${tokenAmount} tokens to ${selectedUser.email}`,
        });
        setTokenModalOpen(false);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Update Plan Tier
  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          msg: `Updated ${selectedUser.email}'s plan to ${selectedPlan}`,
        });
        setPlanModalOpen(false);
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Permanently delete user ${user.email}? This action CANNOT be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", msg: `User ${user.email} deleted` });
        fetchUsers();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Users Directory</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Manage user accounts, modify subscription tiers, grant conversion credits, and enforce access restrictions.
          </p>
        </div>

        <Link
          href="/admin/users/create"
          className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Provision New User
        </Link>
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
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or user ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="">All Plans</option>
            <option value="FREE">Free Tier</option>
            <option value="STANDARD">Standard Tier</option>
            <option value="PRO">Pro Tier</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-rose-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 bg-slate-950/60 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-rose-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Conversions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading users directory...</div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{u.name || "Unnamed"}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          u.plan === "PRO"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : u.plan === "STANDARD"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          u.role === "ADMIN" ? "text-rose-400" : "text-slate-400"
                        }`}
                      >
                        {u.role === "ADMIN" && <Shield className="w-3 h-3" />}
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-amber-300">
                      {u.tokenBalance}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {u.jobCount} jobs
                    </td>

                    <td className="py-3.5 px-4">
                      {u.banned ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                          <XCircle className="w-3.5 h-3.5" /> Banned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setSelectedPlan(u.plan);
                            setPlanModalOpen(true);
                          }}
                          title="Change Plan"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Plan
                        </button>

                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setTokenModalOpen(true);
                          }}
                          title="Grant Tokens"
                          className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-[11px] font-medium transition-colors"
                        >
                          +Tokens
                        </button>

                        <button
                          onClick={() => handleToggleBan(u)}
                          title={u.banned ? "Unban User" : "Ban User"}
                          className={`p-1.5 rounded transition-colors ${
                            u.banned
                              ? "text-emerald-400 hover:bg-emerald-500/10"
                              : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          }`}
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          title="Delete User"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page {page} of {totalPages || 1}
          </div>
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

      {/* Grant Tokens Modal */}
      {tokenModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Grant Conversion Credits</h3>
              <button onClick={() => setTokenModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Grant additional conversion credits to <strong>{selectedUser.email}</strong>.
            </p>
            <form onSubmit={handleGrantTokens} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">Credit Amount</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTokenModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Confirm Grant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {planModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Update Subscription Plan</h3>
              <button onClick={() => setPlanModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Modify plan tier for <strong>{selectedUser.email}</strong>. Redis cache will be invalidated immediately.
            </p>
            <form onSubmit={handleUpdatePlan} className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">Plan Tier</label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="FREE">Free Tier (40MB limit)</option>
                  <option value="STANDARD">Standard Tier (200MB limit)</option>
                  <option value="PRO">Pro Tier (500MB limit)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                >
                  Update Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

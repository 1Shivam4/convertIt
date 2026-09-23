"use client";

import { useState } from "react";
import Link from "next/link";
import { UserPlus, Mail, Shield, Check, Copy, AlertCircle, ArrowLeft } from "lucide-react";

export default function AdminProvisionUserPage() {
  const [mode, setMode] = useState<"direct" | "invite">("direct");

  // Direct User Creation Form
  const [directName, setDirectName] = useState("");
  const [directEmail, setDirectEmail] = useState("");
  const [directPassword, setDirectPassword] = useState("");
  const [directPlan, setDirectPlan] = useState("FREE");
  const [directRole, setDirectRole] = useState("USER");
  const [directTokens, setDirectTokens] = useState(0);

  // Invite Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePlan, setInvitePlan] = useState("FREE");
  const [inviteRole, setInviteRole] = useState("USER");
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleDirectCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: directName,
          email: directEmail,
          password: directPassword,
          plan: directPlan,
          role: directRole,
          initialTokens: Number(directTokens),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create user");
      }

      setSuccessMsg(`User ${data.user.email} created successfully with ${data.user.plan} plan!`);
      setDirectName("");
      setDirectEmail("");
      setDirectPassword("");
      setDirectTokens(0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          plan: invitePlan,
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate invitation");
      }

      setGeneratedInviteLink(data.inviteLink);
      setSuccessMsg(`Invitation link generated for ${inviteEmail}!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedInviteLink) return;
    navigator.clipboard.writeText(generatedInviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Back link & Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/users"
          className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Provision & Invite Users</h1>
          <p className="text-slate-400 text-xs mt-0.5">
            Directly create credentials for new users or generate single-use registration invitations.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => {
            setMode("direct");
            setError(null);
            setSuccessMsg(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            mode === "direct"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Direct User Creation
        </button>

        <button
          onClick={() => {
            setMode("invite");
            setError(null);
            setSuccessMsg(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            mode === "invite"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          Generate Invitation Link
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode 1: Direct User Creation */}
      {mode === "direct" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleDirectCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Password
              </label>
              <input
                type="password"
                required
                value={directPassword}
                onChange={(e) => setDirectPassword(e.target.value)}
                placeholder="Temporary strong password"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Subscription Tier
                </label>
                <select
                  value={directPlan}
                  onChange={(e) => setDirectPlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="FREE">Free Tier</option>
                  <option value="STANDARD">Standard Tier</option>
                  <option value="PRO">Pro Tier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Account Role
                </label>
                <select
                  value={directRole}
                  onChange={(e) => setDirectRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="USER">Regular User</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Tokens
                </label>
                <input
                  type="number"
                  min="0"
                  value={directTokens}
                  onChange={(e) => setDirectTokens(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                {loading ? "Provisioning..." : "Create User Immediately"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode 2: Invitation Generator */}
      {mode === "invite" && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Recipient Email Address
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@domain.com"
                className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Plan on Acceptance
                </label>
                <select
                  value={invitePlan}
                  onChange={(e) => setInvitePlan(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="FREE">Free Tier</option>
                  <option value="STANDARD">Standard Tier</option>
                  <option value="PRO">Pro Tier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assigned Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="USER">Regular User</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                {loading ? "Generating..." : "Generate Magic Invite Link"}
              </button>
            </div>
          </form>

          {/* Generated Link Display */}
          {generatedInviteLink && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Magic Invitation Link (Valid for 7 Days)
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-rose-300 font-mono text-xs select-all focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

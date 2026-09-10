"use client";

import { useState, type FormEvent } from "react";
import { User, Mail, Shield, Check, Loader2 } from "lucide-react";
import { useSession } from "@/app/lib/auth-client";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [name, setName] = useState(session?.user?.name || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      // Simulate profile update or call auth update endpoint
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your account credentials and personal preferences
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-[#131722]/80 border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Profile Details
            </h2>
            <p className="text-xs text-slate-400">
              Update your public display name
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Profile updated successfully!
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name || session?.user?.name || ""}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0b0d11] border border-white/10 focus:border-red-500 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="w-full bg-[#0b0d11]/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Email addresses are managed via your auth provider and cannot be
              changed here.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Security Section */}
      <div className="bg-[#131722]/80 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Security & Authentication
            </h2>
            <p className="text-xs text-slate-400">
              Password and session management
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Your account is secured via Better Auth with encrypted session
          cookies. If you signed in using Google OAuth, your authentication is
          safely handled through your Google security settings.
        </p>
      </div>
    </div>
  );
}

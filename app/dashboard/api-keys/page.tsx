"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldAlert,
  Loader2,
} from "lucide-react";

type ApiKeyItem = {
  id: string;
  key: string;
  createdAt: string;
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch("/api/user/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleGenerateKey = async () => {
    setCreating(true);
    setNewlyCreatedKey(null);
    try {
      const res = await fetch("/api/user/api-keys", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.key.key);
        await fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action cannot be undone.",
      )
    ) {
      return;
    }
    const res = await fetch(`/api/user/api-keys?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage authorization keys for external programmatic access to
            ConvertIt
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateKey}
          disabled={creating}
          className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-red-600/20 shrink-0"
        >
          {creating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Generate New Key
        </button>
      </div>

      {/* Warning callout for newly generated secret key */}
      {newlyCreatedKey && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
            <Check className="w-4 h-4" />
            New API Key Generated!
          </div>
          <p className="text-xs text-slate-300">
            Make sure to copy your secret key now. You won&apos;t be able to see
            it again!
          </p>
          <div className="flex items-center gap-2 bg-[#0b0d11] p-3 rounded-xl border border-white/10 font-mono text-sm text-green-300">
            <span className="truncate flex-1">{newlyCreatedKey}</span>
            <button
              type="button"
              onClick={() => copyToClipboard(newlyCreatedKey, "new-key")}
              className="px-2.5 py-1 text-xs font-semibold bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors flex items-center gap-1 shrink-0"
            >
              {copiedId === "new-key" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copiedId === "new-key" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Keys List */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="w-6 h-6 text-red-500 animate-spin mx-auto" />
        </div>
      ) : keys.length === 0 ? (
        <div className="p-12 bg-[#131722]/50 border border-white/10 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            No API keys active
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Generate an API key to authenticate requests from your custom
            scripts or microservices.
          </p>
        </div>
      ) : (
        <div className="bg-[#131722]/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-white/5">
            {keys.map((k) => (
              <div
                key={k.id}
                className="p-4 sm:p-5 flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 font-mono text-sm text-white">
                    <span>
                      {k.key.substring(0, 8)}••••••••••••••••
                      {k.key.substring(k.key.length - 4)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Created on{" "}
                    {new Date(k.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(k.key, k.id)}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Copy Key"
                  >
                    {copiedId === k.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokeKey(k.id)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">
            Keep your API keys secure
          </p>
          <p>
            Do not share your API keys in public repositories or client-side web
            applications. Treat them like passwords.
          </p>
        </div>
      </div>
    </div>
  );
}

import { Metadata } from "next";
import { Code, Terminal } from "lucide-react";
import DevToolsWorkspace from "@/components/DevToolsWorkspace";

export const metadata: Metadata = {
  title: "Free Developer Tools | JSON, YAML, CSV, Base64 & Hash Generator | ConvertIt",
  description:
    "Free online developer utilities: JSON to YAML, YAML to JSON, CSV to JSON, Base64 encoder/decoder, URL encoder/decoder, and SHA-256 / MD5 hash generator.",
  keywords: [
    "developer tools",
    "JSON to YAML",
    "YAML to JSON",
    "CSV to JSON",
    "JSON to CSV",
    "Base64 encoder",
    "Base64 decoder",
    "URL encoder",
    "Hash generator",
    "SHA-256 generator",
    "MD5 generator",
  ],
};

export default function DeveloperToolsPage() {
  return (
    <div className="min-h-screen bg-[#0b0d11] text-white">
      {/* ── Static Hero Header ──────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-blue-600/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 py-14 text-center relative z-10">
          {/* Engine badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-5">
            <Terminal className="w-3.5 h-3.5" />
            Client-Side Fast &amp; 100% Private
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-3">
            Developer Utilities &amp; Formats
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Instant format transforms and cryptographic tools. Convert between JSON, YAML, and CSV,
            encode Base64/URLs, and compute cryptographic hashes directly in your browser.
          </p>

          {/* Quick capability chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              "JSON ⇋ YAML",
              "CSV ⇋ JSON",
              "Base64 Encode/Decode",
              "URL Encode/Decode",
              "MD5 / SHA-256 / SHA-512",
              "Instant & Private",
            ].map((chip) => (
              <span
                key={chip}
                className="px-3 py-1 text-[11px] font-semibold rounded-full bg-white/5 text-slate-300 border border-white/10"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Workspace ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <DevToolsWorkspace />
      </div>
    </div>
  );
}

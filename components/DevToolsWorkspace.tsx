"use client";

import { useState, useMemo } from "react";
import {
  Code,
  FileCode,
  Table,
  Binary,
  Globe,
  KeyRound,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  jsonToYaml,
  yamlToJson,
  csvToJson,
  jsonToCsv,
  base64Encode,
  base64Decode,
  urlEncode,
  urlDecode,
  generateHash,
} from "@/app/lib/devToolsUtils";
import { toast } from "sonner";

type ToolTab = "json-yaml" | "csv-json" | "base64" | "url" | "hash";

const SAMPLE_JSON = `{
  "platform": "ConvertIt",
  "version": "1.0.0",
  "features": ["PDF", "Image", "Video", "Developer Tools"],
  "stats": {
    "speed": "blazing",
    "secure": true,
    "uptime": 99.99
  }
}`;

const SAMPLE_CSV = `id,name,role,tier
1,Shivam,Admin,PRO
2,Alex,Developer,STANDARD
3,Sam,Designer,FREE`;

export default function DevToolsWorkspace() {
  const [activeTab, setActiveTab] = useState<ToolTab>("json-yaml");
  const [copied, setCopied] = useState<string | null>(null);

  // ── Tab 1: JSON ⇋ YAML State ──
  const [jsonYamlDirection, setJsonYamlDirection] = useState<"json2yaml" | "yaml2json">("json2yaml");
  const [jsonYamlInput, setJsonYamlInput] = useState(SAMPLE_JSON);

  // ── Tab 2: CSV ⇋ JSON State ──
  const [csvJsonDirection, setCsvJsonDirection] = useState<"csv2json" | "json2csv">("csv2json");
  const [csvJsonInput, setCsvJsonInput] = useState(SAMPLE_CSV);
  const [csvDelimiter, setCsvDelimiter] = useState<string>(",");

  // ── Tab 3: Base64 State ──
  const [base64Mode, setBase64Mode] = useState<"encode" | "decode">("encode");
  const [base64Input, setBase64Input] = useState("Hello ConvertIt Developer!");

  // ── Tab 4: URL State ──
  const [urlMode, setUrlMode] = useState<"encode" | "decode">("encode");
  const [urlInput, setUrlInput] = useState("https://convertit.app/search?query=fast conversion&tier=pro");

  // ── Tab 5: Hash State ──
  const [hashInput, setHashInput] = useState("ConvertIt-Secure-Payload");
  const [hashUppercase, setHashUppercase] = useState(false);

  // ── Helper: Copy to Clipboard ──
  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  // ── Computed Outputs ──
  const jsonYamlResult = useMemo(() => {
    if (jsonYamlDirection === "json2yaml") return jsonToYaml(jsonYamlInput);
    return yamlToJson(jsonYamlInput);
  }, [jsonYamlInput, jsonYamlDirection]);

  const csvJsonResult = useMemo(() => {
    if (csvJsonDirection === "csv2json") return csvToJson(csvJsonInput, csvDelimiter);
    return jsonToCsv(csvJsonInput, csvDelimiter);
  }, [csvJsonInput, csvJsonDirection, csvDelimiter]);

  const base64Result = useMemo(() => {
    if (base64Mode === "encode") return { success: true, data: base64Encode(base64Input) };
    return base64Decode(base64Input);
  }, [base64Input, base64Mode]);

  const urlResult = useMemo(() => {
    if (urlMode === "encode") return { success: true, data: urlEncode(urlInput) };
    return urlDecode(urlInput);
  }, [urlInput, urlMode]);

  const hashOutputs = useMemo(() => {
    return {
      md5: generateHash(hashInput, "md5", hashUppercase),
      sha1: generateHash(hashInput, "sha1", hashUppercase),
      sha256: generateHash(hashInput, "sha256", hashUppercase),
      sha512: generateHash(hashInput, "sha512", hashUppercase),
    };
  }, [hashInput, hashUppercase]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Navigation Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-[#131722]/80 border border-white/10 rounded-2xl backdrop-blur-xl">
        {[
          { id: "json-yaml", label: "JSON ⇋ YAML", icon: <FileCode className="w-4 h-4" /> },
          { id: "csv-json", label: "CSV ⇋ JSON", icon: <Table className="w-4 h-4" /> },
          { id: "base64", label: "Base64", icon: <Binary className="w-4 h-4" /> },
          { id: "url", label: "URL Encode/Decode", icon: <Globe className="w-4 h-4" /> },
          { id: "hash", label: "Hash Generator", icon: <KeyRound className="w-4 h-4" /> },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ToolTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Card */}
      <div className="bg-[#131722]/80 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        {/* ── 1. JSON ⇋ YAML ── */}
        {activeTab === "json-yaml" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {jsonYamlDirection === "json2yaml" ? "JSON to YAML" : "YAML to JSON"}
                </span>
                <button
                  onClick={() => {
                    setJsonYamlDirection((prev) => (prev === "json2yaml" ? "yaml2json" : "json2yaml"));
                    if (jsonYamlResult.data) setJsonYamlInput(jsonYamlResult.data);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Swap direction"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setJsonYamlInput(SAMPLE_JSON)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
                >
                  Load Sample
                </button>
                <button
                  onClick={() => setJsonYamlInput("")}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">
                  {jsonYamlDirection === "json2yaml" ? "Input JSON" : "Input YAML"}
                </label>
                <textarea
                  value={jsonYamlInput}
                  onChange={(e) => setJsonYamlInput(e.target.value)}
                  placeholder="Paste or type content here..."
                  className="w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-red-500 transition-all resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">
                    {jsonYamlDirection === "json2yaml" ? "Output YAML" : "Output JSON"}
                  </label>
                  {jsonYamlResult.success && jsonYamlResult.data && (
                    <button
                      onClick={() => handleCopy(jsonYamlResult.data!, "json-yaml")}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      {copied === "json-yaml" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Result
                    </button>
                  )}
                </div>

                <div className="relative w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 overflow-auto">
                  {!jsonYamlResult.success ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {jsonYamlResult.error}
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre">
                      {jsonYamlResult.data || "// Converted output appears here"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. CSV ⇋ JSON ── */}
        {activeTab === "csv-json" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {csvJsonDirection === "csv2json" ? "CSV to JSON" : "JSON to CSV"}
                </span>
                <button
                  onClick={() => {
                    setCsvJsonDirection((prev) => (prev === "csv2json" ? "json2csv" : "csv2json"));
                    if (csvJsonResult.data) setCsvJsonInput(csvJsonResult.data);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Swap direction"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>

                <select
                  value={csvDelimiter}
                  onChange={(e) => setCsvDelimiter(e.target.value)}
                  className="bg-[#0b0d11] border border-white/10 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="	">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCsvJsonInput(SAMPLE_CSV)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
                >
                  Load Sample
                </button>
                <button
                  onClick={() => setCsvJsonInput("")}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">
                  {csvJsonDirection === "csv2json" ? "Input CSV Table" : "Input JSON Array"}
                </label>
                <textarea
                  value={csvJsonInput}
                  onChange={(e) => setCsvJsonInput(e.target.value)}
                  placeholder="Paste table or JSON array..."
                  className="w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-red-500 transition-all resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">
                    {csvJsonDirection === "csv2json" ? "Output JSON" : "Output CSV"}
                  </label>
                  {csvJsonResult.success && csvJsonResult.data && (
                    <button
                      onClick={() => handleCopy(csvJsonResult.data!, "csv-json")}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      {copied === "csv-json" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Result
                    </button>
                  )}
                </div>

                <div className="relative w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 overflow-auto">
                  {!csvJsonResult.success ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {csvJsonResult.error}
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-cyan-400 whitespace-pre">
                      {csvJsonResult.data || "// Converted data appears here"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. Base64 ── */}
        {activeTab === "base64" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 bg-[#0b0d11] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setBase64Mode("encode")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    base64Mode === "encode" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Encode to Base64
                </button>
                <button
                  onClick={() => setBase64Mode("decode")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    base64Mode === "decode" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Decode Base64
                </button>
              </div>

              <button
                onClick={() => setBase64Input("")}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">
                  {base64Mode === "encode" ? "Plain Text / Input" : "Base64 String"}
                </label>
                <textarea
                  value={base64Input}
                  onChange={(e) => setBase64Input(e.target.value)}
                  placeholder="Enter text to process..."
                  className="w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-red-500 transition-all resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">
                    {base64Mode === "encode" ? "Base64 Encoded" : "Decoded Text"}
                  </label>
                  {base64Result.success && base64Result.data && (
                    <button
                      onClick={() => handleCopy(base64Result.data!, "base64")}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      {copied === "base64" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Result
                    </button>
                  )}
                </div>

                <div className="relative w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 overflow-auto">
                  {!base64Result.success ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {base64Result.error}
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-amber-400 whitespace-pre-wrap break-all">
                      {base64Result.data || "// Base64 output appears here"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. URL Encode / Decode ── */}
        {activeTab === "url" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 bg-[#0b0d11] p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setUrlMode("encode")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    urlMode === "encode" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  URL Encode
                </button>
                <button
                  onClick={() => setUrlMode("decode")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    urlMode === "decode" ? "bg-red-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  URL Decode
                </button>
              </div>

              <button
                onClick={() => setUrlInput("")}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-all"
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400">
                  {urlMode === "encode" ? "Raw URL / Text" : "Encoded URL"}
                </label>
                <textarea
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Enter URL to encode or decode..."
                  className="w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-red-500 transition-all resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-400">
                    {urlMode === "encode" ? "Encoded Result" : "Decoded Result"}
                  </label>
                  {urlResult.success && urlResult.data && (
                    <button
                      onClick={() => handleCopy(urlResult.data!, "url")}
                      className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      {copied === "url" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Result
                    </button>
                  )}
                </div>

                <div className="relative w-full h-80 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 overflow-auto">
                  {!urlResult.success ? (
                    <div className="flex items-center gap-2 text-xs text-red-400 font-mono">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {urlResult.error}
                    </div>
                  ) : (
                    <pre className="text-xs font-mono text-sky-400 whitespace-pre-wrap break-all">
                      {urlResult.data || "// URL output appears here"}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. Hash Generator ── */}
        {activeTab === "hash" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white">Cryptographic Hash Generator</span>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hashUppercase}
                  onChange={(e) => setHashUppercase(e.target.checked)}
                  className="rounded border-white/20 bg-[#0b0d11] text-red-600 focus:ring-red-500"
                />
                Uppercase Hashes
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Input String</label>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder="Type or paste any text to hash..."
                className="w-full h-24 bg-[#0b0d11] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white focus:outline-none focus:border-red-500 transition-all resize-none"
                spellCheck={false}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "MD5", hash: hashOutputs.md5, tag: "128-bit" },
                { name: "SHA-1", hash: hashOutputs.sha1, tag: "160-bit" },
                { name: "SHA-256", hash: hashOutputs.sha256, tag: "256-bit (Standard)" },
                { name: "SHA-512", hash: hashOutputs.sha512, tag: "512-bit (High Security)" },
              ].map((item) => (
                <div key={item.name} className="p-4 rounded-2xl bg-[#0b0d11] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-mono">
                        {item.tag}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(item.hash, item.name)}
                      className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium cursor-pointer"
                    >
                      {copied === item.name ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#131722] font-mono text-[11px] text-emerald-400 break-all select-all">
                    {item.hash}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

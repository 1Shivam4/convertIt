/**
 * app/lib/devToolsUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * High-performance pure utility functions for developer tools:
 * JSON ⇋ YAML, CSV ⇋ JSON, Base64, URL Encode/Decode, Cryptographic Hashes.
 */

import YAML from "yaml";
import crypto from "crypto";

export type ConversionResult = {
  success: boolean;
  data?: string;
  error?: string;
};

// ── 1. JSON ⇋ YAML ───────────────────────────────────────────────────────────

export function jsonToYaml(jsonStr: string): ConversionResult {
  try {
    if (!jsonStr.trim()) return { success: true, data: "" };
    const parsed = JSON.parse(jsonStr);
    const yamlData = YAML.stringify(parsed);
    return { success: true, data: yamlData };
  } catch (err: any) {
    return { success: false, error: err.message || "Invalid JSON syntax." };
  }
}

export function yamlToJson(yamlStr: string, indent: number = 2): ConversionResult {
  try {
    if (!yamlStr.trim()) return { success: true, data: "" };
    const parsed = YAML.parse(yamlStr);
    const jsonData = JSON.stringify(parsed, null, indent);
    return { success: true, data: jsonData };
  } catch (err: any) {
    return { success: false, error: err.message || "Invalid YAML syntax." };
  }
}

// ── 2. CSV ⇋ JSON ───────────────────────────────────────────────────────────

export function csvToJson(csvStr: string, delimiter: string = ","): ConversionResult {
  try {
    const trimmed = csvStr.trim();
    if (!trimmed) return { success: true, data: "[]" };

    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { success: true, data: "[]" };

    const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        let val = values[index] ?? "";
        // Auto parse numbers & booleans
        if (val.toLowerCase() === "true") val = true as any;
        else if (val.toLowerCase() === "false") val = false as any;
        else if (!isNaN(Number(val)) && val !== "") val = Number(val) as any;
        obj[header] = val;
      });
      return obj;
    });

    return { success: true, data: JSON.stringify(rows, null, 2) };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to parse CSV." };
  }
}

export function jsonToCsv(jsonStr: string, delimiter: string = ","): ConversionResult {
  try {
    const trimmed = jsonStr.trim();
    if (!trimmed) return { success: true, data: "" };

    const parsed = JSON.parse(trimmed);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    if (items.length === 0) return { success: true, data: "" };

    // Extract all unique headers across objects
    const headerSet = new Set<string>();
    items.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        Object.keys(item).forEach((k) => headerSet.add(k));
      }
    });

    const headers = Array.from(headerSet);
    const csvRows: string[] = [headers.join(delimiter)];

    items.forEach((item) => {
      const row = headers.map((header) => {
        const val = item[header];
        if (val === undefined || val === null) return "";
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        // Escape quotes & wrap in quotes if contains delimiter or newline
        if (str.includes(delimiter) || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(row.join(delimiter));
    });

    return { success: true, data: csvRows.join("\n") };
  } catch (err: any) {
    return { success: false, error: err.message || "Invalid JSON array structure." };
  }
}

// ── 3. Base64 Encode / Decode ────────────────────────────────────────────────

export function base64Encode(text: string): string {
  return Buffer.from(text, "utf-8").toString("base64");
}

export function base64Decode(b64: string): ConversionResult {
  try {
    const decoded = Buffer.from(b64.trim(), "base64").toString("utf-8");
    return { success: true, data: decoded };
  } catch (err: any) {
    return { success: false, error: "Invalid Base64 string." };
  }
}

// ── 4. URL Encode / Decode ───────────────────────────────────────────────────

export function urlEncode(text: string, componentMode: boolean = true): string {
  return componentMode ? encodeURIComponent(text) : encodeURI(text);
}

export function urlDecode(encoded: string): ConversionResult {
  try {
    return { success: true, data: decodeURIComponent(encoded) };
  } catch {
    return { success: false, error: "Malformed URI string." };
  }
}

// ── 5. Hash Generator ────────────────────────────────────────────────────────

export type HashAlgorithm = "md5" | "sha1" | "sha256" | "sha512";

export function generateHash(
  text: string,
  algorithm: HashAlgorithm = "sha256",
  uppercase: boolean = false
): string {
  const hash = crypto.createHash(algorithm).update(text).digest("hex");
  return uppercase ? hash.toUpperCase() : hash;
}

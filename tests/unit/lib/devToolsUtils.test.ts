import { describe, it, expect } from "vitest";
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

describe("Developer Tools Transformation Utilities", () => {
  // ── JSON ⇋ YAML ──
  it("converts JSON to YAML and back correctly", () => {
    const json = '{"name":"ConvertIt","active":true,"count":42}';
    const yamlRes = jsonToYaml(json);
    expect(yamlRes.success).toBe(true);
    expect(yamlRes.data).toContain("name: ConvertIt");
    expect(yamlRes.data).toContain("active: true");

    const jsonRes = yamlToJson(yamlRes.data!);
    expect(jsonRes.success).toBe(true);
    const parsed = JSON.parse(jsonRes.data!);
    expect(parsed.name).toBe("ConvertIt");
    expect(parsed.active).toBe(true);
    expect(parsed.count).toBe(42);
  });

  it("handles malformed JSON and YAML gracefully", () => {
    expect(jsonToYaml("{ invalid json").success).toBe(false);
    expect(yamlToJson("invalid: [yaml: broken").success).toBe(false);
  });

  // ── CSV ⇋ JSON ──
  it("converts CSV to JSON and back correctly", () => {
    const csv = "id,name,role\n1,Shivam,Admin\n2,Alex,Dev";
    const jsonRes = csvToJson(csv);
    expect(jsonRes.success).toBe(true);

    const parsed = JSON.parse(jsonRes.data!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe(1);
    expect(parsed[0].name).toBe("Shivam");

    const csvRes = jsonToCsv(jsonRes.data!);
    expect(csvRes.success).toBe(true);
    expect(csvRes.data).toContain("id,name,role");
    expect(csvRes.data).toContain("1,Shivam,Admin");
  });

  // ── Base64 ──
  it("encodes and decodes Base64 correctly", () => {
    const text = "Antigravity + ConvertIt = 🚀";
    const b64 = base64Encode(text);
    expect(typeof b64).toBe("string");

    const decoded = base64Decode(b64);
    expect(decoded.success).toBe(true);
    expect(decoded.data).toBe(text);
  });

  // ── URL Encode/Decode ──
  it("encodes and decodes URLs correctly", () => {
    const raw = "https://convertit.app/api?name=John Doe&query=pdf+converter";
    const encoded = urlEncode(raw);
    expect(encoded).not.toContain(" ");

    const decoded = urlDecode(encoded);
    expect(decoded.success).toBe(true);
    expect(decoded.data).toBe(raw);
  });

  // ── Hashes ──
  it("generates correct cryptographic hashes", () => {
    const text = "hello-world";
    const sha256 = generateHash(text, "sha256");
    expect(sha256).toBe("afa27b44d43b02a9fea41d13cedc2e4016cfcf87c5dbf990e593669aa8ce286d");

    const md5Upper = generateHash(text, "md5", true);
    expect(md5Upper).toBe("2095312189753DE6AD47DFE20CBE97EC");
  });
});

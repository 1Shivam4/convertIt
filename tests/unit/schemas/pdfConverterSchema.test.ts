import { describe, it, expect } from "vitest";
import { pdfConverterSchema } from "@/app/lib/schemas/pdfConverterSchema";

// Valid base values reused across tests
const validBase = {
  selectedFormatId: "docx",
  rotateAngle: "90" as const,
  pdfaVersion: "PDF/A-1b" as const,
  password: "",
};

describe("pdfConverterSchema — validation", () => {
  // ── Happy paths ─────────────────────────────────────────────────────────────

  it("accepts a valid standard format (docx) without password", () => {
    const result = pdfConverterSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("accepts all valid rotateAngle values", () => {
    for (const angle of ["90", "180", "270"] as const) {
      const result = pdfConverterSchema.safeParse({ ...validBase, rotateAngle: angle });
      expect(result.success, `angle ${angle} should be valid`).toBe(true);
    }
  });

  it("accepts all valid pdfaVersion values", () => {
    for (const version of ["PDF/A-1b", "PDF/A-2b", "PDF/A-3b"] as const) {
      const result = pdfConverterSchema.safeParse({ ...validBase, pdfaVersion: version });
      expect(result.success, `version ${version} should be valid`).toBe(true);
    }
  });

  it("accepts encrypt with a non-empty password", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      selectedFormatId: "encrypt",
      password: "mypassword123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts decrypt with a non-empty password", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      selectedFormatId: "decrypt",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  // ── Failure paths ────────────────────────────────────────────────────────────

  it("rejects empty selectedFormatId", () => {
    const result = pdfConverterSchema.safeParse({ ...validBase, selectedFormatId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("selectedFormatId");
    }
  });

  it("rejects encrypt without a password — error path is ['password']", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      selectedFormatId: "encrypt",
      password: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes("password"));
      expect(issue).toBeDefined();
      expect(issue?.message).toBe("Please enter the PDF password.");
    }
  });

  it("rejects decrypt without a password", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      selectedFormatId: "decrypt",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects encrypt with a whitespace-only password", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      selectedFormatId: "encrypt",
      password: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid rotateAngle value", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      // @ts-expect-error — intentionally bad value for test
      rotateAngle: "45",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid pdfaVersion value", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      // @ts-expect-error — intentionally bad value for test
      pdfaVersion: "PDF/A-4b",
    });
    expect(result.success).toBe(false);
  });

  it("does NOT require password for non-encrypt/decrypt formats (e.g. 'rotate')", () => {
    const result = pdfConverterSchema.safeParse({
      ...validBase,
      selectedFormatId: "rotate",
      password: "",
    });
    expect(result.success).toBe(true);
  });
});

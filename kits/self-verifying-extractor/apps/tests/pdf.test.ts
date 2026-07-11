import { describe, expect, it } from "vitest";
import { MAX_PDF_BYTES, PdfValidationError, safeBlobName, validatePdf } from "../lib/pdf";

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]); // "%PDF-1.7"

function candidate(overrides: Partial<Parameters<typeof validatePdf>[0]> = {}) {
  return {
    name: "invoice.pdf",
    type: "application/pdf",
    size: 2048,
    bytes: PDF_HEADER,
    ...overrides,
  };
}

describe("pdf validation", () => {
  it("accepts a well-formed PDF", () => {
    expect(() => validatePdf(candidate())).not.toThrow();
  });

  it("rejects a non-.pdf extension", () => {
    expect(() => validatePdf(candidate({ name: "invoice.txt" }))).toThrow(PdfValidationError);
    expect(() => validatePdf(candidate({ name: "invoice.txt" }))).toThrow(".pdf extension");
  });

  it("rejects a wrong MIME type", () => {
    expect(() => validatePdf(candidate({ type: "image/png" }))).toThrow("application/pdf");
  });

  it("rejects a file without the %PDF- signature (spoofed extension)", () => {
    const notPdf = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // a ZIP header
    expect(() => validatePdf(candidate({ bytes: notPdf }))).toThrow("%PDF- signature");
  });

  it("rejects an empty file", () => {
    expect(() => validatePdf(candidate({ size: 0 }))).toThrow("empty");
  });

  it("rejects a file over the size limit", () => {
    expect(() => validatePdf(candidate({ size: MAX_PDF_BYTES + 1 }))).toThrow("too large");
  });

  it("produces a filesystem-safe, namespaced blob name", () => {
    const name = safeBlobName("My Invoice (final).pdf");
    expect(name).toMatch(/^self-verifying-extractor\/\d+-/);
    expect(name).toMatch(/\.pdf$/);
    expect(name).not.toMatch(/[()\s]/);
  });
});

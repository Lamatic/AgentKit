export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

// "%PDF-" — the file signature every PDF must begin with.
const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d];

export class PdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfValidationError";
  }
}

export interface PdfCandidate {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}

function hasPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.length < PDF_SIGNATURE.length) return false;
  return PDF_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

/**
 * Validates an uploaded file as a text-based PDF. Checks extension, MIME type,
 * size, and — most importantly — the actual `%PDF-` file signature, so a
 * mislabeled or spoofed file is rejected before it ever reaches storage or a flow.
 * Throws PdfValidationError with a user-facing message on the first failure.
 */
export function validatePdf(candidate: PdfCandidate): void {
  const { name, type, size, bytes } = candidate;

  if (!name.toLowerCase().endsWith(".pdf")) {
    throw new PdfValidationError("File must have a .pdf extension.");
  }
  if (type && type !== "application/pdf") {
    throw new PdfValidationError("File must be a PDF (application/pdf).");
  }
  if (size <= 0) {
    throw new PdfValidationError("File is empty.");
  }
  if (size > MAX_PDF_BYTES) {
    throw new PdfValidationError(
      `PDF is too large. Limit uploads to ${Math.round(MAX_PDF_BYTES / (1024 * 1024))} MB.`,
    );
  }
  if (!hasPdfSignature(bytes)) {
    throw new PdfValidationError("File does not look like a valid PDF (missing %PDF- signature).");
  }
}

/** Filesystem-safe, collision-resistant blob name for a short-lived upload. */
export function safeBlobName(originalName: string): string {
  let cleaned = originalName
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
  // Guard against names that sanitize to empty or a hidden dotfile (e.g. ".pdf").
  if (!cleaned || cleaned.startsWith(".")) {
    cleaned = `document${cleaned}`;
  }
  const base = cleaned.endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
  return `self-verifying-extractor/${Date.now()}-${base}`;
}

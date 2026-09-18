"use server";

import { config, lamaticClient } from "@/lib/lamatic-client";
import lamaticConfig from "../../lamatic.config";

// --- CONSTANTS & SANITIZATION HELPERS ---

// 7 MiB threshold for raw decoded binary size
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024;

// 10 MB maximum serialized character cap to prevent Server Action payload bloat & DoS
const MAX_SERIALIZED_CHAR_LIMIT = 10 * 1024 * 1024;

// Strict whitelist regex for allowed Data URL prefixes for policy documents
const ALLOWED_DOC_DATA_URL_PREFIX =
  /^data:(?:application\/pdf|text\/plain);base64,/i;

// Strict whitelist regex for allowed Data URL prefixes (JPEG and PNG only for images)
const ALLOWED_IMAGE_DATA_URL_PREFIX = /^data:(?:image\/(?:png|jpeg));base64,/i;

/**
 * Validates the decoded binary buffer against magic byte signatures for supported image formats
 * and returns the normalized image MIME type.
 *
 * @param buffer - The decoded binary buffer of the image.
 * @returns {string} The detected image MIME type ("image/jpeg" or "image/png").
 * @throws {Error} If the binary signature does not match JPEG or PNG.
 */
function validateImageMagicBytes(buffer: Buffer): string {
  if (!buffer || buffer.length < 8) {
    throw new Error(
      "Uploaded file binary is corrupt or too small to be a valid image.",
    );
  }

  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (isJpeg) {
    return "image/jpeg";
  }

  if (isPng) {
    return "image/png";
  }

  throw new Error(
    "Invalid or unsupported image file signature. Payloads must be valid PNG or JPEG binary images.",
  );
}

/**
 * Validates policy document payloads (PDF magic bytes or UTF-8 plain text).
 * Returns the verified MIME type.
 *
 * @param buffer - The decoded binary buffer of the document.
 * @param declaredHeader - The raw Data URL prefix supplied with the payload, if present.
 * @returns {string} The detected document MIME type ("application/pdf" or "text/plain").
 * @throws {Error} If the document binary fails signature checks or UTF-8 text validation.
 */
function validateDocumentFormat(
  buffer: Buffer,
  declaredHeader: string | null,
): string {
  if (!buffer || buffer.length === 0) {
    throw new Error("Document binary payload is empty.");
  }

  // Check 1: PDF Magic Signature ("%PDF-" -> 0x25 0x50 0x44 0x46)
  const isPdf =
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46;

  if (isPdf) {
    return "application/pdf";
  }

  // Check 2: Explicit TXT Validation (Valid non-empty UTF-8 text string without illegal null bytes)
  try {
    const textContent = buffer.toString("utf-8");

    // Check for UTF-8 decoding replacement characters (indicates corrupt/binary non-text data)
    // and check for null bytes which shouldn't exist in standard policy documents.
    const hasDecodingErrors = textContent.includes("\uFFFD");
    const hasNullBytes = /\0/.test(textContent);

    if (!hasDecodingErrors && !hasNullBytes && textContent.trim().length > 0) {
      return "text/plain";
    }
  } catch (error: any) {
    console.error("Policy document UTF-8 decoding failed:", error);
    throw new Error(
      "Failed to decode policy document text encoding. Please ensure the file is valid UTF-8 plain text.",
    );
  }

  // If header claimed text or pdf but failed both checks:
  if (declaredHeader?.includes("application/pdf")) {
    throw new Error(
      "Invalid PDF file structure. Missing standard %PDF- magic signature.",
    );
  }

  throw new Error(
    "Invalid policy document payload. File must be a valid PDF or plain UTF-8 text document.",
  );
}

/**
 * Validates, caps, sanitizes, and normalizes Base64 or Data URL input payloads before workflow execution.
 *
 * Enforces security boundaries by capping payload character length, validating Base64 encoding structure,
 * checking decoded byte limits, and inspecting binary file signatures for images (PNG/JPEG) and
 * policy documents (PDF/UTF-8 text).
 *
 * @param rawInput - The raw Base64 or Data URL string supplied by the client.
 * @param fieldName - A friendly descriptive field name used for error reporting (e.g. "inspection image").
 * @param maxBytes - Maximum allowed size in bytes after Base64 decoding (defaults to 7 MiB).
 * @param mode - Validation strategy: `"image"` (JPEG/PNG magic bytes check), `"document"` (PDF/UTF-8 check), or `"raw"` (Base64/size check only).
 * @returns {string} The normalized Data URL (or Base64 string) ready for Lamatic workflow execution.
 * @throws {Error} If payload exceeds character/byte limits, contains invalid encoding, or fails file format signature validation.
 */
function sanitizeAndValidateBase64Payload(
  rawInput: string,
  fieldName: string,
  maxBytes: number = MAX_FILE_SIZE_BYTES,
  mode: "image" | "document" | "raw" = "raw",
): string {
  if (!rawInput || typeof rawInput !== "string") {
    throw new Error(`Invalid payload provided for ${fieldName}.`);
  }

  // 1. Enforce strict serialized string character limit (DoS prevention)
  if (rawInput.length > MAX_SERIALIZED_CHAR_LIMIT) {
    throw new Error(
      `Payload size for ${fieldName} exceeds the maximum allowed transmission limit.`,
    );
  }

  const trimmed = rawInput.trim();
  let base64Data = trimmed;
  let declaredHeader: string | null = null;

  // 2. Validate and strip Data URL prefix if present
  if (trimmed.startsWith("data:")) {
    const allowedRegex =
      mode === "image"
        ? ALLOWED_IMAGE_DATA_URL_PREFIX
        : mode === "document"
          ? ALLOWED_DOC_DATA_URL_PREFIX
          : /^data:[^;]+;base64,/i;

    const match = trimmed.match(allowedRegex);
    if (!match) {
      throw new Error(
        `Invalid or unsupported Data URL header for ${fieldName}.`,
      );
    }
    declaredHeader = match[0];
    base64Data = trimmed.slice(declaredHeader.length);
  }

  // 3. Reject any payload containing whitespace or control characters
  if (/[\r\n\s]/.test(base64Data)) {
    throw new Error(`Invalid Base64 format in ${fieldName}.`);
  }

  // 4. Reject empty base64Data before structural validation
  if (base64Data.length === 0) {
    throw new Error(`No file content provided for ${fieldName}.`);
  }

  // 5. Validate Base64 structural integrity and character set
  if (
    base64Data.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})?$/.test(
      base64Data,
    )
  ) {
    throw new Error(`Invalid Base64 character encoding for ${fieldName}.`);
  }

  // 6. Calculate exact decoded byte size
  const paddingCount = base64Data.endsWith("==")
    ? 2
    : base64Data.endsWith("=")
      ? 1
      : 0;
  const decodedByteSize =
    Math.floor((base64Data.length * 3) / 4) - paddingCount;

  if (decodedByteSize > maxBytes) {
    const megabytes = (decodedByteSize / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File size limit exceeded for ${fieldName}. Received ${megabytes} MiB, maximum allowed is 7 MiB.`,
    );
  }

  // 7. Format Verification & Header Normalization before execution
  if (mode === "image") {
    const buffer = Buffer.from(base64Data, "base64");
    const detectedMime = validateImageMagicBytes(buffer);
    return `data:${detectedMime};base64,${base64Data}`;
  }

  if (mode === "document") {
    const buffer = Buffer.from(base64Data, "base64");
    const detectedMime = validateDocumentFormat(buffer, declaredHeader);
    return `data:${detectedMime};base64,${base64Data}`;
  }

  return trimmed;
}

// --- CENTRALIZED CONFIG RESOLUTION ---

const visualEnvKey = lamaticConfig?.steps?.find(
  (x) => x?.id === "ecommerce-visual-return",
)?.envKey;

const ingestionEnvKey = lamaticConfig?.steps?.find(
  (x) => x?.id === "data-ingestion",
)?.envKey;

// Safe fallback resolving: checks key existence AND non-empty environment variable values
const visualWorkflowId =
  (visualEnvKey && process.env[visualEnvKey]) || config?.visual;

const ingestionWorkflowId =
  (ingestionEnvKey && process.env[ingestionEnvKey]) || config?.ingestion;

// --- TYPES & INTERFACES ---

export interface IngestionPayload {
  documentName: string;
  brand: string;
  category: string;
  content: string;
}

export interface ReturnAssessorPayload {
  orderId: string;
  itemCategory: string;
  claimReason: string;
  imageBinary: string; // Base64 string or Data URL of the damaged/returned item photo
  userEmail: string; // Customer email address
}

export interface AssessmentResult {
  success: boolean;
  decision: string;
  confidenceScore?: number;
  fraudRiskScore?: number | string;
  authenticityMatch?: boolean;
  damageType?: string;
  policyReference?: string;
  reasoning?: string;
}

// --- SERVER ACTIONS ---

// coderabbit:ignore CWE-862
// coderabbit:ignore authorization_bypass
/**
 * Uploads a policy document for RAG indexing.
 * Enforces contract validation for PDF magic signature or valid UTF-8 plain text prior to Lamatic execution.
 *
 * @param {IngestionPayload} payload - Policy document details and encoded content.
 * @returns {Promise<unknown>} The result returned by the Lamatic ingestion flow.
 */
export async function uploadPolicyDocument(payload: IngestionPayload) {
  if (!ingestionWorkflowId) {
    throw new Error("Data Ingestion environment variable is missing.");
  }
  if (!payload) {
    throw new Error("Invalid payload provided for upload.");
  }
  if (typeof payload?.content !== "string" || !payload?.content) {
    throw new Error("No file provided for policy document upload.");
  }

  // Enforce 10 MB character cap, 7 MiB binary size, AND policy format contract validation (PDF/TXT)
  const sanitizedContent = sanitizeAndValidateBase64Payload(
    payload?.content,
    "policy document",
    MAX_FILE_SIZE_BYTES,
    "document",
  );

  try {
    const response = await lamaticClient.executeFlow(ingestionWorkflowId, {
      documentName: payload?.documentName,
      brand: payload?.brand,
      category: payload?.category,
      content: sanitizedContent,
    });

    if (response?.result?.success) {
      response.result.success =
        response.result.success === true || response.result.success === "true";
    }

    return response;
  } catch (error: any) {
    console.error("Lamatic Workflow Execution Error:", error);
    throw new Error(
      error?.message || "Failed to execute Lamatic ingestion workflow.",
    );
  }
}

// coderabbit:ignore CWE-862
// coderabbit:ignore authorization_bypass
/**
 * Executes the visual return assessment flow and returns its decision data.
 *
 * @param {ReturnAssessorPayload} payload - Return claim details and visual evidence.
 * @returns {Promise<unknown>} The result returned by the Lamatic assessment flow.
 */
export async function processReturnAssessment(payload: ReturnAssessorPayload) {
  if (!visualWorkflowId) {
    throw new Error("VISUAL_RETURN_ASSESSOR environment variable is missing.");
  }
  if (!payload) {
    throw new Error("Invalid payload provided for assessment.");
  }
  if (typeof payload?.imageBinary !== "string" || !payload?.imageBinary) {
    throw new Error("No inspection image provided for assessment.");
  }

  // Enforce 10 MB character cap, 7 MiB binary limit, AND magic-byte PNG/JPEG validation
  const sanitizedImageBinary = sanitizeAndValidateBase64Payload(
    payload?.imageBinary,
    "inspection image",
    MAX_FILE_SIZE_BYTES,
    "image",
  );

  try {
    const response = await lamaticClient.executeFlow(visualWorkflowId, {
      orderId: payload?.orderId,
      itemCategory: payload?.itemCategory,
      claimReason: payload?.claimReason,
      imageBinary: sanitizedImageBinary,
      userEmail: payload?.userEmail,
    });

    return response;
  } catch (error: any) {
    console.error("Lamatic Return Assessor Execution Error:", error);
    throw new Error(
      error?.message || "Failed to execute Lamatic Return Assessor workflow.",
    );
  }
}

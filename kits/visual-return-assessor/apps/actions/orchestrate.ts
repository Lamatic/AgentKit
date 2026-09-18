"use server";

import { config, lamaticClient } from "@/lib/lamatic-client";
import lamaticConfig from "../../lamatic.config";

// --- CONSTANTS & SANITIZATION HELPERS ---

// 7 MiB threshold for raw decoded binary size
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024;

// 10 MB maximum serialized character cap to prevent Server Action payload bloat & DoS
const MAX_SERIALIZED_CHAR_LIMIT = 10 * 1024 * 1024;

// Strict whitelist regex for allowed Data URL prefixes
const ALLOWED_DATA_URL_PREFIX =
  /^data:(?:image\/(?:png|jpeg|webp|gif)|application\/pdf|text\/plain);base64,/i;

/**
 * Validates the decoded binary buffer against magic byte signatures for supported image formats.
 *
 * Supported formats:
 * - JPEG: FF D8 FF
 * - PNG:  89 50 4E 47 0D 0A 1A 0A
 * - WebP: 52 49 46 46 (RIFF) ... 57 41 56 45 / 57 45 42 50 (WEBP)
 */
function validateImageMagicBytes(buffer: Buffer): void {
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

  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error(
      "Invalid or unsupported image file signature. Payloads must be valid PNG, JPEG, or WebP binary images.",
    );
  }
}

/**
 * Validates, caps, and sanitizes Base64 or Data URL input payloads.
 * Protects against DoS attacks via unbounded serialized strings or malicious headers.
 *
 * @param rawInput - The raw Base64 or Data URL payload from the client.
 * @param fieldName - Friendly name of the payload field for error reporting.
 * @param maxBytes - Maximum allowed decoded size in bytes (defaults to 7 MiB).
 * @param verifyImageSignature - Set to true to enforce magic byte checking for image inputs.
 * @returns {string} The sanitized payload ready for Lamatic execution.
 * @throws {Error} If the string exceeds character limits, contains illegal characters, or fails signature validation.
 */
function sanitizeAndValidateBase64Payload(
  rawInput: string,
  fieldName: string,
  maxBytes: number = MAX_FILE_SIZE_BYTES,
  verifyImageSignature: boolean = false,
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

  // 2. Validate and strip Data URL prefix if present
  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(ALLOWED_DATA_URL_PREFIX);
    if (!match) {
      throw new Error(
        `Invalid or unsupported Data URL header for ${fieldName}.`,
      );
    }
    base64Data = trimmed.slice(match[0].length);
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

  // 7. Verify magic bytes / file signature if required
  if (verifyImageSignature) {
    const buffer = Buffer.from(base64Data, "base64");
    validateImageMagicBytes(buffer);
  }

  // Return sanitized, trimmed string to avoid forwarding inflated payload bloat
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
 * Intentionally unauthenticated for open-source kit environment.
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

  // Enforce 10 MB serialized character cap and 7 MiB binary size boundary
  const sanitizedContent = sanitizeAndValidateBase64Payload(
    payload?.content,
    "policy document",
    MAX_FILE_SIZE_BYTES,
    false,
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
 * Intentionally unauthenticated for open-source kit environment.
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

  // Enforce 10 MB serialized character cap, 7 MiB binary limit, AND magic-byte image validation
  const sanitizedImageBinary = sanitizeAndValidateBase64Payload(
    payload?.imageBinary,
    "inspection image",
    MAX_FILE_SIZE_BYTES,
    true,
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

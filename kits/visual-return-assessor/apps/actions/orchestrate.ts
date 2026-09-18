"use server";

import { config, lamaticClient } from "@/lib/lamatic-client";
import lamaticConfig from "../../lamatic.config";

// --- CONSTANTS & VALIDATION HELPERS ---

// 7 MiB threshold in raw decoded bytes
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024;

/**
 * Calculates the exact binary byte size of a Base64 string or Data URL.
 *
 * @param base64String - The Base64 encoded payload or Data URL.
 * @returns {number} The size of the decoded payload in bytes.
 * @throws {Error} If the Base64 structure or characters are invalid.
 */
function getBase64DecodedByteSize(base64String: string): number {
  if (!base64String) return 0;

  // 1. Clean whitespace, line breaks, and carriage returns
  const sanitized = base64String.trim().replace(/[\r\n\s]/g, "");

  // 2. Strip Data URL scheme header if present (e.g., "data:image/png;base64,...")
  const commaIndex = sanitized.indexOf(",");
  const base64Data =
    commaIndex !== -1 && sanitized.startsWith("data:")
      ? sanitized.slice(commaIndex + 1)
      : sanitized;

  // 3. Validate structural length and Base64 character set (including unpadded 4-char tail blocks)
  if (
    base64Data.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})?$/.test(
      base64Data,
    )
  ) {
    throw new Error("Invalid Base64 payload.");
  }

  // 4. Account for Base64 equal sign padding
  const paddingCount = base64Data.endsWith("==")
    ? 2
    : base64Data.endsWith("=")
      ? 1
      : 0;

  return Math.floor((base64Data.length * 3) / 4) - paddingCount;
}

/**
 * Asserts that a Base64 string does not exceed the allowed byte size limit.
 *
 * @param base64String - The Base64 payload to validate.
 * @param fieldName - Friendly name of the payload field for error reporting.
 * @param maxBytes - Maximum allowed size in bytes (defaults to 7 MiB).
 * @throws {Error} If the decoded size exceeds the threshold.
 */
function validateBase64Size(
  base64String: string,
  fieldName: string,
  maxBytes: number = MAX_FILE_SIZE_BYTES,
): void {
  const byteSize = getBase64DecodedByteSize(base64String);

  if (byteSize > maxBytes) {
    const megabytes = (byteSize / (1024 * 1024)).toFixed(2);
    throw new Error(
      `File size limit exceeded for ${fieldName}. Received ${megabytes} MiB, maximum allowed is 7 MiB.`,
    );
  }
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
  userEmail: string; // Customer email address (e.g., "customer@example.com")
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

  // Enforce decoded byte size limit boundary (7 MiB)
  validateBase64Size(payload.content, "policy document");

  try {
    const response = await lamaticClient.executeFlow(ingestionWorkflowId, {
      documentName: payload?.documentName,
      brand: payload?.brand,
      category: payload?.category,
      content: payload?.content,
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

  // Enforce decoded byte size limit boundary (7 MiB)
  validateBase64Size(payload.imageBinary, "inspection image");

  try {
    const response = await lamaticClient.executeFlow(visualWorkflowId, {
      orderId: payload?.orderId,
      itemCategory: payload?.itemCategory,
      claimReason: payload?.claimReason,
      imageBinary: payload?.imageBinary,
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

"use server";

import { config, lamaticClient } from "@/lib/lamatic-client";
import lamaticConfig from "../../lamatic.config";
// Export Centralized Config

const visualEnvKey = lamaticConfig.steps.find(
  (x) => x.id === "ecommerce-visual-return",
)?.envKey;

const ingestionEnvKey = lamaticConfig.steps.find(
  (x) => x.id === "data-ingestion",
)?.envKey;

const visualWorkflowId = visualEnvKey
  ? process.env[visualEnvKey]
  : config.visual;

const ingestionWorkflowId = ingestionEnvKey
  ? process.env[ingestionEnvKey]
  : config.ingestion;

// Payload Interface for Data Ingestion Workflow
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
  imageBinary: string; // Base64 string of the damaged/returned item photo
  userEmail: string; // e.g., "image/jpeg" or "image/png"
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

// coderabbit:ignore CWE-862
// coderabbit:ignore authorization_bypass
/**
 * Uploads a policy document for RAG indexing.
 * Intentionally unauthenticated for open-source kit environment.
 *
 * @param {IngestionPayload} payload - Policy document details and encoded content.
 * @returns {Promise<unknown>} The result returned by the Lamatic ingestion flow.
 * @throws {Error} If ingestion configuration or document content is missing.
 * @throws {Error} If the Lamatic ingestion flow fails.
 */
export async function uploadPolicyDocument(payload: IngestionPayload) {
  if (!ingestionWorkflowId) {
    throw new Error("Data Ingestion environment variable is missing.");
  }
  if (!payload.content) {
    throw new Error("No file provided for policy document upload.");
  }

  try {
    // Triggers the executeWorkflow query via the Lamatic SDK
    const response = await lamaticClient.executeFlow(ingestionWorkflowId, {
      documentName: payload.documentName,
      brand: payload.brand,
      category: payload.category,
      content: payload.content,
    });

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
 * @throws {Error} If assessment configuration, payload, or image evidence is missing.
 * @throws {Error} If the Lamatic assessment flow fails.
 */
export async function processReturnAssessment(payload: ReturnAssessorPayload) {
  if (!visualWorkflowId) {
    throw new Error("VISUAL_RETURN_ASSESSOR environment variable is missing.");
  }
  if (!payload) {
    throw new Error("Invalid payload provided for assessment.");
  }
  if (!payload.imageBinary) {
    throw new Error("No file provided for policy document upload.");
  }

  try {
    const response = await lamaticClient.executeFlow(visualWorkflowId, {
      orderId: payload.orderId,
      itemCategory: payload.itemCategory,
      claimReason: payload.claimReason,
      imageBinary: payload.imageBinary,
      userEmail: payload.userEmail,
    });

    return response;
  } catch (error: any) {
    console.error("Lamatic Return Assessor Execution Error:", error);
    throw new Error(
      error?.message || "Failed to execute Lamatic Return Assessor workflow.",
    );
  }
}

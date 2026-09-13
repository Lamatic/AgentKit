"use server";

import { config, lamaticClient } from "@/lib/lamatic-client";
// Export Centralized Config

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

/**
 * Executes the Data Ingestion Workflow on Lamatic AI
 */
export async function uploadPolicyDocument(payload: IngestionPayload) {
  if (!config.ingestion) {
    throw new Error("Data Ingestion environment variable is missing.");
  }

  try {
    // Triggers the executeWorkflow query via the Lamatic SDK
    const response = await lamaticClient.executeFlow(
      config.ingestion,
      (payload = {
        documentName: payload.documentName,
        brand: payload.brand,
        category: payload.category,
        content: payload.content,
      }),
    );

    return response;
  } catch (error: any) {
    console.error("Lamatic Workflow Execution Error:", error);
    throw new Error(
      error?.message || "Failed to execute Lamatic ingestion workflow.",
    );
  }
}

export async function processReturnAssessment(payload: ReturnAssessorPayload) {
  if (!config.visual) {
    throw new Error("VISUAL_RETURN_ASSESSOR environment variable is missing.");
  }

  try {
    const response = await lamaticClient.executeFlow(
      config.visual,
      (payload = {
        orderId: payload.orderId,
        itemCategory: payload.itemCategory,
        claimReason: payload.claimReason,
        imageBinary: payload.imageBinary,
        userEmail: payload.userEmail,
      }),
    );

    return response;
  } catch (error: any) {
    console.error("Lamatic Return Assessor Execution Error:", error);
    throw new Error(
      error?.message || "Failed to execute Lamatic Return Assessor workflow.",
    );
  }
}

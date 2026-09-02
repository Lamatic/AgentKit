"use server"

import crypto from "crypto"
import { headers } from "next/headers"
import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

export interface TrustReportFlag {
  region: string;
  signal: "metadata" | "font_spacing" | "ela" | "vlm";
  confidence: number;
  explanation: string;
}

export interface TrustReport {
  risk_score: number;
  verdict: string;
  verdict_color: "green" | "amber" | "orange" | "red";
  flags: TrustReportFlag[];
  signal_breakdown: {
    metadata: { flags: number; score_contribution: number };
    font_spacing: { flags: number; score_contribution: number };
    ela: { flags: number; score_contribution: number };
    vlm: { flags: number; score_contribution: number };
  };
  document_info: {
    file_name: string;
    file_type: string;
    analyzed_at: string;
  };
  disclaimer: string;
}

// In-memory rate limiter per IP/session: max 10 requests per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count += 1;
  return true;
}

// Allowed file signatures / magic bytes
function validateFileSignature(buffer: Buffer): { isValid: boolean; detectedMime: string | null } {
  // PDF: starts with %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { isValid: true, detectedMime: "application/pdf" };
  }
  // PNG: starts with \x89PNG (0x89, 0x50, 0x4E, 0x47)
  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { isValid: true, detectedMime: "image/png" };
  }
  // JPEG: starts with \xFF\xD8\xFF (0xFF, 0xD8, 0xFF)
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, detectedMime: "image/jpeg" };
  }
  return { isValid: false, detectedMime: null };
}

export async function analyzeDocument(
  fileBase64: string,
  fileName: string,
  fileType: string,
  ocrBoxes: any[] = []
): Promise<{
  success: boolean;
  data?: TrustReport;
  error?: string;
}> {
  const correlationId = crypto.randomUUID();

  try {
    // 1. Basic rate limiting per IP
    let clientIp = "unknown-client";
    try {
      const headerList = await headers();
      const forwardedFor = headerList.get("x-forwarded-for");
      const realIp = headerList.get("x-real-ip");
      clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (realIp || "unknown-client");
    } catch {
      // Fallback if headers cannot be inspected
    }

    if (!checkRateLimit(clientIp)) {
      return {
        success: false,
        error: "Rate limit exceeded. Too many analysis requests. Please wait a minute and try again.",
      };
    }

    // 2. Decode base64 and validate server-side byte length
    if (!fileBase64 || typeof fileBase64 !== "string") {
      throw new Error("No document content provided.");
    }

    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, "base64");

    if (fileBuffer.length === 0) {
      throw new Error("The uploaded file is empty or corrupted.");
    }

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum allowed limit of 10MB.`);
    }

    // 3. File signature / magic bytes validation
    const { isValid, detectedMime } = validateFileSignature(fileBuffer);
    if (!isValid || !detectedMime) {
      throw new Error("Invalid file format. Uploaded document does not match allowed signatures (PDF, PNG, JPEG).");
    }

    // 4. Non-reversible correlation ID logging (without PII)
    console.log("[document-tamper-detector] Analyzing document:", {
      correlationId,
      detectedMime,
      fileSizeBytes: fileBuffer.length,
    });

    const flow = config.flows.documentTamperDetector;

    if (!flow.workflowId) {
      throw new Error("DOCUMENT_TAMPER_DETECTOR_FLOW_ID is not configured.");
    }

    const inputs = {
      fileBase64,
      fileName,
      fileType: detectedMime,
      ocrBoxes,
    };

    console.log("[document-tamper-detector] Executing flow for correlationId:", correlationId, flow.workflowId);
    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs);
    console.log("[document-tamper-detector] Flow response received for correlationId:", correlationId);

    const trustReport = resData?.result?.trustReport;

    if (!trustReport) {
      throw new Error("No trust report returned from the analysis flow.");
    }

    return {
      success: true,
      data: trustReport as TrustReport,
    };
  } catch (error) {
    console.error(`[document-tamper-detector] Analysis error [${correlationId}]:`, error);

    let errorMessage = "Unknown error occurred during document analysis.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to the Lamatic service. Please check your internet connection and API configuration.";
      } else if (error.message.includes("API key") || error.message.includes("Unauthorized")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration.";
      } else if (error.message.includes("Flow ID") || error.message.includes("not found")) {
        errorMessage = "Flow configuration error: The document analysis flow ID is invalid or the flow has not been deployed.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

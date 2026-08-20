"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { executeTests, TestPayload } from "@/lib/executor"

const PAYLOAD_GENERATOR_ID = process.env.OPENAPI_PAYLOAD_GENERATOR;
const RESULT_ANALYZER_ID = process.env.OPENAPI_RESULT_ANALYZER;

export async function generatePayloads(
  specContent: string
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    if (!PAYLOAD_GENERATOR_ID) {
      throw new Error("OPENAPI_PAYLOAD_GENERATOR environment variable is missing.");
    }

    console.log("[v0] Starting payload generation for spec");
    console.log("[DEBUG] Using API URL:", process.env.LAMATIC_API_URL);
    console.log("[DEBUG] Using Project ID:", process.env.LAMATIC_PROJECT_ID);
    console.log("[DEBUG] Using Flow ID:", PAYLOAD_GENERATOR_ID);

    // The openapi-payload-generator expects { openapiSpec: string }
    const inputs = {
      openapiSpec: specContent
    };

    const resData = await lamaticClient.executeFlow(PAYLOAD_GENERATOR_ID, inputs);
    
    // Dump the exact response into the terminal so the user can inspect it
    console.log("[DEBUG] Raw Lamatic Response:", JSON.stringify(resData, null, 2));
    
    // The accumulator code node returns { testSuite: [] }
    const testSuite = resData?.result?.testSuite;

    if (!testSuite) {
      throw new Error("No test suite generated. Lamatic response: " + JSON.stringify(resData));
    }

    return {
      success: true,
      data: testSuite,
    }
  } catch (error: any) {
    console.error("[v0] Payload Generation error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}

export async function executeTestsOnly(
  baseUrl: string,
  authHeader: string,
  testPayloads: TestPayload[]
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    console.log(`[v0] Starting test execution against ${baseUrl} for ${testPayloads.length} payloads`);

    // 1. Run tests with rate limiting
    const executionResults = await executeTests(baseUrl, authHeader, testPayloads, 5);

    return {
      success: true,
      data: executionResults,
    }
  } catch (error: any) {
    console.error("[v0] Execute error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}

export async function analyzeResultsOnly(
  specContent: string,
  testPayloads: TestPayload[],
  executionResults: any
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    if (!RESULT_ANALYZER_ID) {
      throw new Error("OPENAPI_RESULT_ANALYZER environment variable is missing.");
    }

    console.log(`[v0] Calling analyzer...`);

    // 2. Call analyzer
    // The openapi-result-analyzer expects { openapiSpec, testPayloads, executionResults }
    const inputs = {
      openapiSpec: specContent,
      testPayloads: JSON.stringify(testPayloads),
      executionResults: JSON.stringify(executionResults)
    };

    const resData = await lamaticClient.executeFlow(RESULT_ANALYZER_ID, inputs);

    let parsedResult = resData?.result;

    // If the LLM returned a raw string, we need to safely parse it
    if (typeof parsedResult === "string") {
      try {
        const cleanStr = parsedResult.replace(/```(?:json)?/g, "").trim();
        parsedResult = JSON.parse(cleanStr);
      } catch (e) {
        console.error("Failed to parse analyzer string output:", parsedResult);
      }
    }

    const summary = parsedResult?.summary;
    const findings = parsedResult?.findings;

    if (!summary || !findings) {
      throw new Error("Failed to extract summary/findings from analyzer. Response: " + JSON.stringify(resData));
    }

    return {
      success: true,
      data: { summary, findings },
    }
  } catch (error: any) {
    console.error("[v0] Analyze error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    }
  }
}

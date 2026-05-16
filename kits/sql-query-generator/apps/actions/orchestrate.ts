"use server";

import lamaticClient from "@/lib/lamatic-client";

interface SQLGeneratorResult {
  sql: string | null;
  explanation: string;
  tables_used: string[];
  assumptions: string | null;
  confidence: "high" | "medium" | "low";
}

interface GenerateQueryResponse {
  success: boolean;
  data?: SQLGeneratorResult;
  error?: string;
}

function parseResponse(raw: string): SQLGeneratorResult {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  return JSON.parse(cleaned);
}

export async function generateQuery(
  schema: string,
  question: string
): Promise<GenerateQueryResponse> {
  try {
    if (!schema.trim()) {
      return { success: false, error: "Please provide a database schema." };
    }
    if (!question.trim()) {
      return { success: false, error: "Please provide a question." };
    }

    const flowId = process.env.SQL_QUERY_GENERATOR_FLOW_ID;
    if (!flowId) {
      return { success: false, error: "Flow ID is not configured." };
    }

    const response = await lamaticClient.executeFlow(flowId, {
      schema: schema,
      question: question,
    });

    const result = (response as any)?.result?.result;

    if (!result) {
      return { success: false, error: "No response received from the agent." };
    }

    const parsed = parseResponse(result);
    return { success: true, data: parsed };
  } catch (err) {
    console.error("SQL generation error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Something went wrong.",
    };
  }
}
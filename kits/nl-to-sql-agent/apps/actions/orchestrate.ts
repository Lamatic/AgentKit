"use server";

import config from "../../lamatic.config";
import { executeLamaticFlow, LamaticClientError } from "@/lib/lamatic-client";
import { getSession } from "@/lib/session";
import {
  isApprovedDemoQuestion,
  decideDemoRequest,
} from "@/lib/demo-questions";

const DEMO_RESTRICTION_MESSAGE =
  "Demo account restriction: This public demo supports the predefined example queries shown in the Workspace. Please select one of the available demo questions to see the full NL-to-SQL flow.";

// Per AgentKit conventions, the action reads the flow step definition from the
// parent kit's lamatic.config and resolves the deployed flow ID through the
// step's envKey (NL_TO_SQL_FLOW_ID). Fails closed when the config or env var
// is missing, mirroring lamatic-client.ts.
const sqlFlowStep = config.steps.find(s => s.id === "nl-to-sql-flow");
if (!sqlFlowStep?.envKey) {
  throw new Error(
    "nl-to-sql-flow step not found in lamatic.config.ts. Please check the configuration."
  );
}

function resolveFlowId(envKey: string): string {
  const flowId = process.env[envKey];
  if (!flowId) {
    throw new Error(
      `${envKey} is not set. Please add it to your .env.local file.`
    );
  }
  return flowId;
}

const NL_TO_SQL_FLOW_ID = resolveFlowId(sqlFlowStep.envKey);

export type NLToSQLResponse = {
  sql: string;
  explanation: string;
  summary: string;
  insights: Array<{ title: string; detail: string }>;
  suggestions: Array<{ action: string; reason: string }>;
  followUpQuestions: string[];
  isSafe: string;
  results: any[];
  rowCount: number;
  error: string;
  warnings: string[];
};

function parseArrayLike(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function deriveSummaryFromResults(results: any[], question: string): string {
  if (!Array.isArray(results) || results.length === 0) {
    return "No result data was provided for analysis.";
  }

  const firstRow = results[0];
  const keys = Object.keys(firstRow || {})
    .filter((key) => key !== "_rowNumber" && key !== "__typename");

  if (keys.length === 0) {
    return `The query returned ${results.length} row${results.length === 1 ? "" : "s"}.`;
  }

  const sampleValue = firstRow[keys[0]];
  const metricText = typeof sampleValue === "number"
    ? `${sampleValue.toLocaleString()}`
    : String(sampleValue ?? "the available data");

  return `The query returned ${results.length} row${results.length === 1 ? "" : "s"}. The dataset includes ${keys.length} field${keys.length === 1 ? "" : "s"}, with a sample value of ${metricText}.`;
}

function normalizeLamaticResponse(rawResult: any, question: string): NLToSQLResponse {
  const defaults: NLToSQLResponse = {
    sql: "",
    explanation: "",
    summary: "",
    insights: [],
    suggestions: [],
    followUpQuestions: [],
    isSafe: "false",
    results: [],
    rowCount: 0,
    error: "",
    warnings: [],
  };

  if (!rawResult || typeof rawResult !== "object") {
    return { ...defaults, error: "Workflow returned an empty or invalid response." };
  }

  // Extract fields from the Lamatic API Response node output
  const sql = typeof rawResult.sql === "string" ? rawResult.sql : "";
  const explanation = typeof rawResult.explanation === "string" ? rawResult.explanation : "";

  let results: any[] = [];
  if (Array.isArray(rawResult.results)) {
    results = rawResult.results;
  } else if (Array.isArray(rawResult.data)) {
    results = rawResult.data;
  } else if (rawResult.queryResult && typeof rawResult.queryResult === "object") {
    if (Array.isArray(rawResult.queryResult.rows)) {
      results = rawResult.queryResult.rows;
    } else if (Array.isArray(rawResult.queryResult)) {
      results = rawResult.queryResult;
    }
  }

  const isGenericEmptySummary = (value: string) => /returned no rows|no result data was provided for analysis|no data to analyze/i.test(value || "");
  const summary = typeof rawResult.summary === "string" && rawResult.summary.trim().length > 0 && !isGenericEmptySummary(rawResult.summary)
    ? rawResult.summary
    : deriveSummaryFromResults(results, question);

  const insights = parseArrayLike(rawResult.insights)
    .map((item: any) => ({
      title: typeof item?.title === "string" ? item.title : "Insight",
      detail: typeof item?.detail === "string" ? item.detail : "",
    }))
    .filter((item) => item.detail.length > 0);

  const suggestions = parseArrayLike(rawResult.suggestions)
    .map((item: any) => ({
      action: typeof item?.action === "string" ? item.action : "Suggested next step",
      reason: typeof item?.reason === "string" ? item.reason : "",
    }))
    .filter((item) => item.reason.length > 0);

  const followUpQuestions = parseArrayLike(rawResult.followUpQuestions)
    .map((item: any) => typeof item === "string" ? item : "")
    .filter((item) => item.length > 0);

  // isSafe must be a string: "true" or "false"
  let isSafe = "false";
  if (rawResult.isSafe === true || rawResult.isSafe === "true" || rawResult.isSafe === "TRUE") {
    isSafe = "true";
  } else if (rawResult.isSafe === false || rawResult.isSafe === "false" || rawResult.isSafe === "FALSE") {
    isSafe = "false";
  } else if (typeof rawResult.isSafe === "string" && rawResult.isSafe.length > 0) {
    isSafe = rawResult.isSafe.toLowerCase();
  }

  // rowCount must be a number
  let rowCount = typeof rawResult.rowCount === "number" ? rawResult.rowCount : results.length;

  // error must be a string (empty if no error)
  const error = typeof rawResult.error === "string" ? rawResult.error : "";

  // warnings must be an array
  const warnings: string[] = Array.isArray(rawResult.warnings) ? rawResult.warnings : [];

  return {
    sql,
    explanation,
    summary,
    insights,
    suggestions,
    followUpQuestions,
    isSafe,
    results,
    rowCount,
    error,
    warnings,
  };
}

function mockResponse(): { success: true; data: NLToSQLResponse } {
  return {
    success: true,
    data: {
      sql: "SELECT TOP 10 * FROM users;",
      explanation: "This query selects all columns from the users table and limits the results to 10 rows.",
      summary: "The query returned 2 rows. The dataset includes 3 fields, with a sample value of 1.",
      insights: [
        { title: "Result set loaded", detail: "The query returned 2 records and the data is ready for analysis." }
      ],
      suggestions: [
        { action: "Review the data distribution", reason: "Check whether the returned rows match the expected segment or time window." }
      ],
      followUpQuestions: [
        "Would you like to break this down by another column?"
      ],
      isSafe: "true",
      results: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" }
      ],
      rowCount: 2,
      error: "",
      warnings: []
    }
  };
}

export async function executeFlow(
  input: { question: string }
): Promise<{
  success: boolean;
  data?: NLToSQLResponse;
  error?: string;
}> {
  // Validate the action input before touching any helper that calls .trim()
  // or accesses the question (e.g. isApprovedDemoQuestion) so malformed input
  // returns a controlled error instead of throwing outside the try block.
  if (typeof input?.question !== "string" || input.question.trim().length === 0) {
    return {
      success: false,
      error: "A question is required.",
    };
  }

  const session = await getSession();
  const isDemo = session.isLoggedIn && session.isDemo === true;
  const isApproved = isApprovedDemoQuestion(input.question);

  // Restricted demo sessions may only run the approved demo questions.
  // Enforced server-side, before the mock branch or the real flow, so an
  // unsupported question never touches Lamatic nor receives unrelated data.
  const decision = decideDemoRequest({
    isDemo,
    isApproved,
    mockEnabled: process.env.MOCK_LAMATIC === "true",
  });

  if (decision.kind === "blocked") {
    return {
      success: false,
      error: DEMO_RESTRICTION_MESSAGE,
    };
  }

  if (!session.isLoggedIn) {
    return {
      success: false,
      error: "Unauthorized: Please log in to use this service.",
    };
  }

  // Mock mode for local/offline development testing. Never applied to a
  // restricted demo session, so an approved demo question always runs the real
  // Lamatic flow and mock output can never masquerade as a real answer.
  if (decision.kind === "mock") {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockResponse();
  }

  try {
    console.log("Executing NL-to-SQL flow", {
      questionLength: input.question.length,
    });

    const resData = await executeLamaticFlow(NL_TO_SQL_FLOW_ID, {
      question: input.question,
    });

    console.log("Lamatic status:", resData.status);
    console.log("Lamatic result keys:", resData.result ? Object.keys(resData.result) : "null");

    if (resData.status === "error") {
      console.error("Lamatic error:", resData.message);
      return {
        success: false,
        error: "Lamatic workflow execution failed. Please try again later.",
      };
    }

    const flowResult = resData.result;

    if (!flowResult) {
      return {
        success: false,
        error: "No result returned from workflow. The flow may not be configured correctly.",
      };
    }

    // Normalize the response to match our expected schema
    const normalized = normalizeLamaticResponse(flowResult, input.question);

    console.log("Normalized - sql length:", normalized.sql.length,
      "explanation length:", normalized.explanation.length,
      "isSafe:", normalized.isSafe,
      "results count:", normalized.results.length,
      "rowCount:", normalized.rowCount,
      "error:", normalized.error || "none",
      "warnings count:", normalized.warnings.length);

    return {
      success: true,
      data: normalized,
    };
  } catch (error) {
    console.error("NL-to-SQL flow execution failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Generic safe client message while preserving server-side diagnostics
    let errorMessage = "The query service encountered an error. Please try again.";

    if (error instanceof Error) {
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to the query service. Please check your internet connection.";
      } else if (
        error instanceof LamaticClientError &&
        typeof error.statusCode === "number"
      ) {
        // Surface only the status code class, not the full error details
        if (error.statusCode === 401 || error.statusCode === 403) {
          errorMessage = "Authentication error: Please contact your administrator.";
        } else if (error.statusCode >= 500) {
          errorMessage = "Service error: The query service is temporarily unavailable. Please try again later.";
        } else if (error.statusCode === 429) {
          errorMessage = "Rate limit exceeded: Please wait a moment and try again.";
        } else {
          errorMessage = `Query service error (${error.statusCode}): Please try again or contact support.`;
        }
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please contact your administrator.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

import { isAuditResponse, normalizeAuditResponse } from "./audit-response.js";

const requiredEnv = ["LAMATIC_API_URL", "LAMATIC_API_KEY", "LAMATIC_PROJECT_ID", "LAMATIC_FLOW_ID"];
const defaultTimeoutMs = 60000;
const minTimeoutMs = 3000;
const maxTimeoutMs = 120000;
const allowedLamaticHosts = new Set(["lamatic.dev", "lamatic.ai"]);
const executeFlowQuery = `
  query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
    executeWorkflow(workflowId: $workflowId, payload: $payload) {
      status
      result
    }
  }
`;

export class LamaticClientError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = "LamaticClientError";
    this.code = code;
    this.status = status;
  }
}

export function hasLamaticConfig() {
  return requiredEnv.every((name) => {
    const value = process.env[name];
    return value && !isPlaceholderValue(value);
  });
}

export async function callLamaticFlow(auditRequest, requestSignal) {
  const apiUrl = parseLamaticApiUrl(process.env.LAMATIC_API_URL);
  const timeoutMs = parseLamaticTimeoutMs(process.env.LAMATIC_TIMEOUT_MS);
  if (requestSignal?.aborted) {
    throw new LamaticClientError("aborted", "Lamatic request was cancelled before it completed");
  }
  const controller = new AbortController();
  let requestAborted = false;
  const abortFromRequest = () => {
    requestAborted = true;
    controller.abort();
  };
  requestSignal?.addEventListener("abort", abortFromRequest, { once: true });
  if (requestSignal?.aborted) {
    requestSignal.removeEventListener("abort", abortFromRequest);
    throw new LamaticClientError("aborted", "Lamatic request was cancelled before it completed");
  }
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
        "x-project-id": process.env.LAMATIC_PROJECT_ID
      },
      body: JSON.stringify({
        query: executeFlowQuery,
        variables: {
          workflowId: process.env.LAMATIC_FLOW_ID,
          payload: auditRequest
        }
      }),
      signal: controller.signal,
      redirect: "error"
    });

    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new LamaticClientError(
        "http",
        `Lamatic request failed with status ${response.status}`,
        response.status
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      if (error?.name === "AbortError") {
        throw error;
      }
      if (error?.name === "SyntaxError") {
        throw new LamaticClientError("malformed-json", "Lamatic returned malformed JSON");
      }
      throw new LamaticClientError("response-read", "Lamatic response body could not be read");
    }
    const graphqlError = getGraphqlErrorMessage(payload);
    if (graphqlError) {
      throw new LamaticClientError("graphql", `Lamatic GraphQL error: ${graphqlError}`);
    }
    const executionError = getExecutionErrorMessage(payload);
    if (executionError) {
      throw new LamaticClientError("execution", `Lamatic workflow execution failed: ${executionError}`);
    }
    const audit = unwrapAuditResponse(payload, auditRequest.detectedSignals);
    if (!audit) {
      throw new LamaticClientError("unexpected-shape", "Lamatic returned an unexpected response shape");
    }
    return audit;
  } catch (error) {
    if (error?.name === "AbortError") {
      if (requestAborted || requestSignal?.aborted) {
        throw new LamaticClientError("aborted", "Lamatic request was cancelled before it completed");
      }
      throw new LamaticClientError("timeout", `Lamatic request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener("abort", abortFromRequest);
  }
}

export function parseLamaticTimeoutMs(value) {
  const parsed = Number(value || defaultTimeoutMs);
  return Number.isFinite(parsed) && parsed >= minTimeoutMs && parsed <= maxTimeoutMs
    ? parsed
    : defaultTimeoutMs;
}

export function parseLamaticApiUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new LamaticClientError("config", "LAMATIC_API_URL must be a valid HTTPS URL");
  }
  if (url.protocol !== "https:") {
    throw new LamaticClientError("config", "LAMATIC_API_URL must use HTTPS");
  }
  if (!isLamaticHost(url.hostname)) {
    throw new LamaticClientError("config", "LAMATIC_API_URL must point to a Lamatic runtime host");
  }
  return url.toString();
}

function isLamaticHost(hostname) {
  return allowedLamaticHosts.has(hostname) || hostname.endsWith(".lamatic.dev") || hostname.endsWith(".lamatic.ai");
}

function isPlaceholderValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const hyphenated = normalized.replaceAll("_", "-");
  return (
    !normalized ||
    hyphenated.startsWith("replace-with") ||
    hyphenated.startsWith("your-") ||
    [
      "replace-me",
      "update-me",
      "fill-this-in",
      "todo",
      "tbd",
      "changeme",
      "change-me",
      "placeholder",
      "example",
      "null",
      "undefined",
      "default"
    ].includes(hyphenated) ||
    /^change-?me(?:[-\d].*)?$/.test(hyphenated)
  );
}

export function unwrapAuditResponse(payload, detectedSignals) {
  return unwrapCandidate(payload, detectedSignals, 0, new Set());
}

function getGraphqlErrorMessage(payload) {
  if (!Array.isArray(payload?.errors) || payload.errors.length === 0) {
    return "";
  }
  const firstError = payload.errors[0];
  return typeof firstError?.message === "string" && firstError.message.trim()
    ? firstError.message.trim()
    : "unknown GraphQL error";
}

function getExecutionErrorMessage(payload) {
  const execution = payload?.data?.executeWorkflow;
  if (!execution || typeof execution !== "object" || execution.status === "success") {
    return "";
  }
  if (typeof execution.message === "string" && execution.message.trim()) {
    return execution.message.trim();
  }
  if (typeof execution.result?.message === "string" && execution.result.message.trim()) {
    return execution.result.message.trim();
  }
  return String(execution.status || "unknown execution error");
}

function unwrapCandidate(value, detectedSignals, depth, seen) {
  if (depth > 4 || value == null) {
    return null;
  }

  if (typeof value === "string") {
    try {
      return unwrapCandidate(JSON.parse(value), detectedSignals, depth + 1, seen);
    } catch {
      return null;
    }
  }

  if (typeof value !== "object") {
    return null;
  }

  if (seen.has(value)) {
    return null;
  }
  seen.add(value);

  const normalized = normalizeAuditResponse(value, detectedSignals);
  if (isAuditResponse(normalized)) {
    return normalized;
  }

  for (const key of ["result", "data", "output", "body", "executeWorkflow"]) {
    const unwrapped = unwrapCandidate(value[key], detectedSignals, depth + 1, seen);
    if (unwrapped) {
      return unwrapped;
    }
  }

  return null;
}

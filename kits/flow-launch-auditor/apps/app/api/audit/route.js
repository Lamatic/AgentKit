import { NextResponse } from "next/server.js";
import { buildNotEnoughContextResponse, extractDetectedSignals } from "../../../lib/preflight.js";
import { callLamaticFlow, hasLamaticConfig, LamaticClientError } from "../../../lib/lamatic-client.js";
import { isAuditResponse } from "../../../lib/audit-response.js";
import { buildMockAuditResponse } from "../../../lib/mock-audit.js";
import { checkAuditRateLimit } from "../../../lib/audit-rate-limit.js";
import { redactSecretValues } from "../../../lib/redaction.js";
import { isTruthyEnvValue } from "../../../lib/env.js";

const errorCopy = "The audit could not complete. Check that the flow brief is plain text and try again.";
const localValidationError = "The local audit response failed validation. Check the app response schema.";
const maxRequestBodyBytes = 327680;
const apiResponseHeaders = {
  "Cache-Control": "no-store"
};

class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Request body is too large");
    this.name = "RequestBodyTooLargeError";
  }
}

class RequestBodyAbortedError extends Error {
  constructor() {
    super("Request body upload was cancelled");
    this.name = "RequestBodyAbortedError";
  }
}

export async function POST(request) {
  const requestId = crypto.randomUUID();
  try {
    const rateLimit = checkAuditRateLimit(request);
    if (!rateLimit.allowed) {
      if (rateLimit.reason === "missing-client-key") {
        return jsonResponse(
          {
            error: "The audit is temporarily unavailable. Check the trusted-proxy client IP configuration and try again.",
            code: "proxy-client-ip"
          },
          { status: 503, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
          requestId
        );
      }
      return jsonResponse(
        { error: "Too many audit requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
        requestId
      );
    }

    if (!isJsonRequest(request)) {
      return jsonResponse({ error: "Send the audit request with Content-Type: application/json." }, { status: 415 }, requestId);
    }

    let body;
    try {
      body = JSON.parse(await readBoundedRequestText(request));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return jsonResponse({ error: "Keep the request body under 320 KiB." }, { status: 413 }, requestId);
      }
      if (error instanceof RequestBodyAbortedError) {
        return jsonResponse({ error: "The audit request was cancelled before it finished uploading." }, { status: 499 }, requestId);
      }
      return jsonResponse({ error: "Send the audit request as JSON." }, { status: 400 }, requestId);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "Send the audit request as a JSON object." }, { status: 400 }, requestId);
    }

    const rawFlowBrief = typeof body.flowBrief === "string" ? body.flowBrief : "";
    const hasOptionalFlowExport = Object.hasOwn(body, "optionalFlowExport");
    if (hasOptionalFlowExport && typeof body.optionalFlowExport !== "string") {
      return jsonResponse({ error: "optionalFlowExport must be a string." }, { status: 400 }, requestId);
    }
    const rawOptionalFlowExport = hasOptionalFlowExport ? body.optionalFlowExport : "";

    if (hasUnsafeControlCharacters(rawFlowBrief) || hasUnsafeControlCharacters(rawOptionalFlowExport)) {
      return jsonResponse({ error: "Remove control characters from the pasted Flow text." }, { status: 400 }, requestId);
    }

    if (!rawFlowBrief.trim()) {
      return jsonResponse({ error: "Flow Brief is required." }, { status: 400 }, requestId);
    }
    if (rawFlowBrief.length > 12000 || rawOptionalFlowExport.length > 12000) {
      return jsonResponse({ error: "Keep each input under 12,000 characters." }, { status: 400 }, requestId);
    }

    const flowBrief = redactSecretValues(rawFlowBrief.trim());
    const optionalFlowExport = redactSecretValues(rawOptionalFlowExport.trim());

    const detectedSignals = extractDetectedSignals(flowBrief, optionalFlowExport);
    const auditRequest = {
      flowBrief,
      optionalFlowExport,
      detectedSignals
    };

    if (!detectedSignals.hasEnoughContext) {
      const audit = buildNotEnoughContextResponse(detectedSignals);
      if (!isAuditResponse(audit)) {
        return jsonResponse({ error: localValidationError }, { status: 502 }, requestId);
      }
      return jsonResponse({ source: "preflight", audit }, {}, requestId);
    }

    if (hasLamaticConfig()) {
      const audit = await callLamaticFlow(auditRequest, request.signal);
      if (!isAuditResponse(audit)) {
        return jsonResponse({ error: errorCopy }, { status: 502 }, requestId);
      }
      return jsonResponse({ source: "lamatic", audit }, {}, requestId);
    }

    if (isMockDisabled()) {
      return jsonResponse(
        {
          error: "Lamatic API configuration is required when the local mock is disabled.",
          code: "config"
        },
        { status: 503 },
        requestId
      );
    }

    const audit = buildMockAuditResponse(auditRequest);
    if (!isAuditResponse(audit)) {
      return jsonResponse({ error: localValidationError }, { status: 502 }, requestId);
    }
    return jsonResponse({ source: "mock", audit }, {}, requestId);
  } catch (error) {
    logRequestError(error, requestId);
    if (error instanceof LamaticClientError) {
      const status =
        error.code === "timeout"
          ? 504
          : error.code === "aborted"
            ? 499
            : error.code === "http"
              ? error.status || 502
              : 502;
      const message =
        error.code === "timeout"
          ? "The audit timed out. Check the Lamatic Flow status and try again."
          : error.code === "aborted"
            ? "The audit request was cancelled before it finished."
            : error.code === "malformed-json"
              ? "The audit returned malformed JSON. Check the Lamatic Flow response format."
              : error.code === "graphql" || error.code === "execution"
                ? "The Lamatic Flow returned an execution error. Check the Flow ID and runtime configuration."
                : error.code === "unexpected-shape"
                  ? "The audit returned an unexpected response shape. Check the Lamatic Flow output schema."
                  : error.code === "config"
                    ? "The Lamatic API configuration is invalid. Check the URL and credentials."
                    : errorCopy;
      return jsonResponse({ error: message, code: error.code }, { status }, requestId);
    }
    return jsonResponse({ error: errorCopy }, { status: 500 }, requestId);
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...apiResponseHeaders,
      Allow: "POST, OPTIONS"
    }
  });
}

function jsonResponse(body, init = {}, requestId) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...apiResponseHeaders,
      ...(requestId ? { "X-Request-Id": requestId } : {}),
      ...(init.headers || {})
    }
  });
}

function isMockDisabled() {
  return isTruthyEnvValue(process.env.DISABLE_MOCK);
}

function isJsonRequest(request) {
  const contentType = request.headers.get("content-type") || "";
  return contentType.toLowerCase().split(";")[0].trim() === "application/json";
}

function hasUnsafeControlCharacters(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/u.test(value);
}

async function readBoundedRequestText(request) {
  const reader = request.body?.getReader();
  if (!reader) {
    return "";
  }
  const decoder = new TextDecoder();
  const chunks = [];
  let bytesRead = 0;

  while (true) {
    if (request.signal?.aborted) {
      await reader.cancel().catch(() => {});
      throw new RequestBodyAbortedError();
    }
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (request.signal?.aborted) {
      await reader.cancel().catch(() => {});
      throw new RequestBodyAbortedError();
    }
    bytesRead += value.byteLength;
    if (bytesRead > maxRequestBodyBytes) {
      await reader.cancel().catch(() => {});
      throw new RequestBodyTooLargeError();
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join("");
}

function logRequestError(error, requestId) {
  console.error("Flow Launch Auditor request failed:", {
    requestId,
    name: error?.name,
    code: error?.code,
    status: error?.status
  });
}

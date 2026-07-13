import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { OPTIONS, POST } from "../app/api/audit/route.js";
import { isAuditResponse } from "../lib/audit-response.js";
import { resetAuditRateLimitForTests } from "../lib/audit-rate-limit.js";

const originalFetch = globalThis.fetch;
const lamaticEnv = ["LAMATIC_API_URL", "LAMATIC_API_KEY", "LAMATIC_PROJECT_ID", "LAMATIC_FLOW_ID", "LAMATIC_TIMEOUT_MS"];
const routeEnv = [...lamaticEnv, "TRUST_PROXY_HEADERS", "DISABLE_MOCK"];
const originalRouteEnv = Object.fromEntries(routeEnv.map((name) => [name, process.env[name]]));

const readyBrief = `A customer support team uses a Lamatic Flow for billing classification. The Flow trigger is a helpdesk webhook and the model calls a read-only billing API before returning category, confidence, reason, suggestedQueue, and billingStatus.
The API has a timeout fallback that sets billingStatus to unknown. The README lists env vars with placeholders, six eval fixtures cover common ticket types, and logs include run ID, category, API status, and fallback reason without full email bodies.
Privacy notes say no PII values or tokens are logged, and credentials stay in environment variables.`;

beforeEach(() => {
  resetAuditRateLimitForTests();
  for (const name of routeEnv) {
    delete process.env[name];
  }
  globalThis.fetch = originalFetch;
});

afterEach(() => {
  resetAuditRateLimitForTests();
  restoreLamaticEnv();
  globalThis.fetch = originalFetch;
});

test("POST returns preflight response for thin input", async () => {
  const response = await POST(jsonRequest({ flowBrief: "Please audit my AI helper." }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.source, "preflight");
  assert.equal(body.audit.launchDecision, "not-enough-context");
  assert.equal(isAuditResponse(body.audit), true);
  assertApiHeaders(response);
});

test("POST returns validated mock audit when Lamatic env is absent", async () => {
  const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.source, "mock");
  assert.equal(body.audit.launchDecision, "ready");
  assert.equal(isAuditResponse(body.audit), true);
  assertApiHeaders(response);
});

test("POST can disable the local mock when Lamatic env is absent", async () => {
  process.env.DISABLE_MOCK = "true";
  const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.code, "config");
  assert.equal(body.error, "Lamatic API configuration is required when the local mock is disabled.");
  assertApiHeaders(response);
});

test("POST calls Lamatic when mock is disabled and Lamatic config is present", async () => {
  process.env.DISABLE_MOCK = "true";
  configureLamaticEnv();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({
      data: {
        executeWorkflow: {
          status: "success",
          result: readyAudit()
        }
      }
    }), { status: 200 });

  const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.source, "lamatic");
  assert.equal(body.audit.launchDecision, "ready");
});

test("POST redacts secret-like values before sending Lamatic payloads", async () => {
  configureLamaticEnv();
  let requestPayload;
  globalThis.fetch = async (_url, options) => {
    requestPayload = JSON.parse(options.body);
    return new Response(JSON.stringify({
      data: {
        executeWorkflow: {
          status: "success",
          result: readyAudit()
        }
      }
    }), { status: 200 });
  };

  const response = await POST(jsonRequest({
    flowBrief: `${readyBrief}\nBILLING_API_KEY=sk-real-secret-value`,
    optionalFlowExport: "Authorization: Bearer abcdefghijklmnop"
  }));

  assert.equal(response.status, 200);
  assert.equal(requestPayload.variables.payload.flowBrief.includes("sk-real-secret-value"), false);
  assert.equal(requestPayload.variables.payload.flowBrief.includes("BILLING_API_KEY=<redacted>"), true);
  assert.equal(requestPayload.variables.payload.optionalFlowExport.includes("Bearer <redacted>"), true);
});

test("OPTIONS advertises the audit route methods", async () => {
  const response = await OPTIONS();

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("allow"), "POST, OPTIONS");
  assert.equal(response.headers.get("access-control-allow-methods"), null);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("POST rejects malformed JSON", async () => {
  const response = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{"
    })
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Send the audit request as JSON.");
  assertApiHeaders(response);
});

test("POST rejects non-JSON content types", async () => {
  const response = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: JSON.stringify({ flowBrief: readyBrief })
    })
  );
  const body = await response.json();

  assert.equal(response.status, 415);
  assert.equal(body.error, "Send the audit request with Content-Type: application/json.");
});

test("POST rejects non-object JSON bodies", async () => {
  const response = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null"
    })
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Send the audit request as a JSON object.");
});

test("POST rejects oversized inputs", async () => {
  const response = await POST(jsonRequest({ flowBrief: "x".repeat(12001), optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Keep each input under 12,000 characters.");
});

test("POST rejects unsafe control characters before auditing", async () => {
  const response = await POST(jsonRequest({ flowBrief: `${readyBrief}\u202E`, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Remove control characters from the pasted Flow text.");
  assertApiHeaders(response);
});

test("POST rejects unsafe control characters before trimming input", async () => {
  const response = await POST(jsonRequest({ flowBrief: `\u000B${readyBrief}`, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Remove control characters from the pasted Flow text.");
  assertApiHeaders(response);
});

test("POST rejects present non-string optionalFlowExport values", async () => {
  const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: { flow: "bad" } }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "optionalFlowExport must be a string.");
});

test("POST rejects empty flow briefs", async () => {
  const response = await POST(jsonRequest({ flowBrief: "   ", optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Flow Brief is required.");
});

test("POST can return needs-review and not-ready mock decisions", async () => {
  const needsReview = await POST(jsonRequest({
    flowBrief: `A customer team needs a Lamatic Flow for onboarding. The Flow trigger receives a form submission and the model returns a checklist.
The README includes setup guidance and config notes. Evals include fixtures and assertions. Failure paths include retry, timeout, and fallback. Logs include run ID and metrics. Sensitive data is redacted.`,
    optionalFlowExport: ""
  }));
  const needsReviewBody = await needsReview.json();
  assert.equal(needsReview.status, 200);
  assert.equal(needsReviewBody.source, "mock");
  assert.equal(needsReviewBody.audit.launchDecision, "needs-review");

  const notReady = await POST(jsonRequest({
    flowBrief: `A customer wants a Lamatic Flow for billing support. The Flow trigger is a webhook, then a model calls an API and returns a queue decision.
There are no tests, no retry behavior, the API key is hardcoded, and logs full email body content for debugging before launch.`,
    optionalFlowExport: ""
  }));
  const notReadyBody = await notReady.json();
  assert.equal(notReady.status, 200);
  assert.equal(notReadyBody.source, "mock");
  assert.equal(notReadyBody.audit.launchDecision, "not-ready");
});

test("POST preserves upstream Lamatic HTTP status codes", async () => {
  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";
  globalThis.fetch = async () => new Response(JSON.stringify({ error: "rate limited" }), { status: 429 });

  const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 429);
  assert.equal(body.code, "http");
});

test("POST maps Lamatic timeout, malformed JSON, and unexpected shapes", async () => {
  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";

  globalThis.fetch = async () => {
    const error = new Error("timeout");
    error.name = "AbortError";
    throw error;
  };
  const timeoutResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const timeoutBody = await timeoutResponse.json();
  assert.equal(timeoutResponse.status, 504);
  assert.equal(timeoutBody.code, "timeout");

  globalThis.fetch = async () => new Response("not json", { status: 200 });
  const malformedResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const malformedBody = await malformedResponse.json();
  assert.equal(malformedResponse.status, 502);
  assert.equal(malformedBody.code, "malformed-json");

  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      throw new TypeError("internal stream failure");
    }
  });
  const readFailureResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const readFailureBody = await readFailureResponse.json();
  assert.equal(readFailureResponse.status, 502);
  assert.equal(readFailureBody.code, "response-read");
  assert.equal(readFailureBody.error.includes("internal stream failure"), false);

  globalThis.fetch = async () => new Response(JSON.stringify({ message: "ok" }), { status: 200 });
  const unexpectedResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const unexpectedBody = await unexpectedResponse.json();
  assert.equal(unexpectedResponse.status, 502);
  assert.equal(unexpectedBody.code, "unexpected-shape");
});

test("POST maps Lamatic request cancellation separately from timeout", async () => {
  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";
  const incoming = new AbortController();

  globalThis.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener(
        "abort",
        () => {
          const error = new Error("aborted by request");
          error.name = "AbortError";
          reject(error);
        },
        { once: true }
      );
      incoming.abort();
    });

  const response = await POST(new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: incoming.signal,
    body: JSON.stringify({ flowBrief: readyBrief, optionalFlowExport: "" })
  }));
  const body = await response.json();

  assert.equal(response.status, 499);
  assert.equal(body.code, "aborted");
  assert.equal(body.error, "The audit request was cancelled before it finished.");
});

test("POST maps Lamatic GraphQL and execution errors without leaking upstream messages", async () => {
  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ errors: [{ message: "Workflow not found" }] }), { status: 200 });
  const graphqlResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const graphqlBody = await graphqlResponse.json();
  assert.equal(graphqlResponse.status, 502);
  assert.equal(graphqlBody.code, "graphql");
  assert.equal(
    graphqlBody.error,
    "The Lamatic Flow returned an execution error. Check the Flow ID and runtime configuration."
  );
  assert.equal(graphqlBody.error.includes("Workflow not found"), false);

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: {
          executeWorkflow: {
            status: "error",
            result: {
              message: "Flow execution failed"
            }
          }
        }
      }),
      { status: 200 }
    );
  const executionResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const executionBody = await executionResponse.json();
  assert.equal(executionResponse.status, 502);
  assert.equal(executionBody.code, "execution");
  assert.equal(
    executionBody.error,
    "The Lamatic Flow returned an execution error. Check the Flow ID and runtime configuration."
  );
  assert.equal(executionBody.error.includes("Flow execution failed"), false);
});

test("POST rejects oversized raw request bodies before parsing JSON", async () => {
  const response = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: `{"flowBrief":"${"x".repeat(400000)}"}`
    })
  );
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.equal(body.error, "Keep the request body under 320 KiB.");
});

test("POST cancels oversized request streams", async () => {
  let cancelled = false;
  const response = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      duplex: "half",
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`{"flowBrief":"${"x".repeat(400000)}"}`));
        },
        cancel() {
          cancelled = true;
        }
      })
    })
  );
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.equal(body.error, "Keep the request body under 320 KiB.");
  assert.equal(cancelled, true);
});

test("POST stops body reads when the request is already aborted", async () => {
  let cancelled = false;
  const controller = new AbortController();
  controller.abort();
  const response = await POST(
    new Request("http://localhost/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      duplex: "half",
      signal: controller.signal,
      body: new ReadableStream({
        pull(streamController) {
          streamController.enqueue(new TextEncoder().encode(`{"flowBrief":"${readyBrief}"}`));
        },
        cancel() {
          cancelled = true;
        }
      })
    })
  );
  const body = await response.json();

  assert.equal(response.status, 499);
  assert.equal(body.error, "The audit request was cancelled before it finished uploading.");
  assert.equal(cancelled, true);
});

test("POST accepts valid 12,000-character non-ASCII briefs below field limits", async () => {
  const response = await POST(jsonRequest({ flowBrief: "界".repeat(12000), optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.source, "preflight");
  assert.equal(body.audit.launchDecision, "not-enough-context");
});

test("POST applies field limits before secret redaction can shorten input", async () => {
  const response = await POST(jsonRequest({
    flowBrief: `WEBHOOK_URL=${"s".repeat(12000)}`,
    optionalFlowExport: ""
  }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "Keep each input under 12,000 characters.");
});

test("POST rejects non-HTTPS Lamatic URLs before sending credentials", async () => {
  process.env.LAMATIC_API_URL = "http://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";
  globalThis.fetch = async () => {
    throw new Error("fetch should not be called for unsafe Lamatic URLs");
  };

  const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }));
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.code, "config");
  assert.equal(body.error, "The Lamatic API configuration is invalid. Check the URL and credentials.");
});

test("POST rate limits repeated requests from the same client", async () => {
  let lastResponse;
  for (let index = 0; index < 21; index += 1) {
    lastResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "203.0.113.10"));
  }
  const body = await lastResponse.json();
  const retryAfter = Number(lastResponse.headers.get("retry-after"));

  assert.equal(lastResponse.status, 429);
  assert.equal(Number.isInteger(retryAfter), true);
  assert.equal(retryAfter >= 1 && retryAfter <= 60, true);
  assert.equal(body.error, "Too many audit requests. Try again shortly.");
  assertApiHeaders(lastResponse);
});

test("POST rate limiting can key by forwarded IP behind a trusted proxy", async () => {
  process.env.TRUST_PROXY_HEADERS = "yes";

  for (let index = 0; index < 20; index += 1) {
    const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "203.0.113.10"));
    assert.equal(response.status, 200);
  }

  const otherClientResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "203.0.113.11"));
  assert.equal(otherClientResponse.status, 200);

  const limitedResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "203.0.113.10"));
  const body = await limitedResponse.json();
  assert.equal(limitedResponse.status, 429);
  assert.equal(body.error, "Too many audit requests. Try again shortly.");
});

test("POST returns a retryable service error for multi-entry x-forwarded-for chains", async () => {
  process.env.TRUST_PROXY_HEADERS = "true";

  const response = await POST(jsonRequest(
    { flowBrief: readyBrief, optionalFlowExport: "" },
    "198.51.100.99, 203.0.113.10"
  ));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(body.code, "proxy-client-ip");
  assert.match(body.error, /trusted-proxy client IP configuration/);
});

test("POST rate limiting can key by x-real-ip behind a trusted proxy", async () => {
  process.env.TRUST_PROXY_HEADERS = "1";

  for (let index = 0; index < 20; index += 1) {
    const response = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "", "203.0.113.10"));
    assert.equal(response.status, 200);
  }

  const otherClientResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "", "203.0.113.11"));
  assert.equal(otherClientResponse.status, 200);

  const limitedResponse = await POST(jsonRequest({ flowBrief: readyBrief, optionalFlowExport: "" }, "", "203.0.113.10"));
  assert.equal(limitedResponse.status, 429);
});

test("POST returns a retryable service error without a trusted-proxy client header", async () => {
  process.env.TRUST_PROXY_HEADERS = "true";
  const response = await POST(new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ flowBrief: readyBrief, optionalFlowExport: "" })
  }));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(body.code, "proxy-client-ip");
  assert.match(body.error, /trusted-proxy client IP configuration/);
});

test("POST rejects non-IP trusted-proxy header values", async () => {
  process.env.TRUST_PROXY_HEADERS = "true";
  const response = await POST(jsonRequest(
    { flowBrief: readyBrief, optionalFlowExport: "" },
    "attacker-controlled-bucket"
  ));
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.code, "proxy-client-ip");
});

function jsonRequest(body, forwardedFor = "198.51.100.10", realIp = "") {
  const headers = { "content-type": "application/json" };
  if (forwardedFor) {
    headers["x-forwarded-for"] = forwardedFor;
  }
  if (realIp) {
    headers["x-real-ip"] = realIp;
  }
  return new Request("http://localhost/api/audit", {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
}

function assertApiHeaders(response) {
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal(response.headers.get("access-control-expose-headers"), null);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.match(response.headers.get("x-request-id") || "", /^[0-9a-f-]{36}$/);
}

function configureLamaticEnv() {
  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";
}

function readyAudit() {
  return {
    launchDecision: "ready",
    confidence: "high",
    summary: "The Flow is ready for launch.",
    detectedSignals: {
      hasEnoughContext: true,
      envLikeTokens: [],
      categorySignals: {
        "evals-and-tests": [],
        "tool-boundaries": [],
        "failure-paths": [],
        "security-and-privacy": [],
        "env-and-setup-docs": [],
        "observability-and-logging": [],
        "cost-and-latency": []
      }
    },
    topRisks: [],
    findings: [],
    recommendedFixes: [],
    questionsToContinue: []
  };
}

function restoreLamaticEnv() {
  for (const name of routeEnv) {
    if (originalRouteEnv[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = originalRouteEnv[name];
    }
  }
}

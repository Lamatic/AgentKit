import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { isAuditResponse } from "../lib/audit-response.js";
import {
  callLamaticFlow,
  hasLamaticConfig,
  LamaticClientError,
  parseLamaticApiUrl,
  parseLamaticTimeoutMs,
  unwrapAuditResponse
} from "../lib/lamatic-client.js";

const originalFetch = globalThis.fetch;
const lamaticEnv = ["LAMATIC_API_URL", "LAMATIC_API_KEY", "LAMATIC_PROJECT_ID", "LAMATIC_FLOW_ID", "LAMATIC_TIMEOUT_MS"];
const originalLamaticEnv = Object.fromEntries(lamaticEnv.map((name) => [name, process.env[name]]));

const audit = {
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

afterEach(() => {
  restoreLamaticEnv();
  globalThis.fetch = originalFetch;
});

test("unwrapAuditResponse accepts direct audit bodies", () => {
  assert.deepEqual(unwrapAuditResponse(audit), audit);
});

test("unwrapAuditResponse accepts common object wrappers", () => {
  assert.deepEqual(unwrapAuditResponse({ result: audit }), audit);
  assert.deepEqual(unwrapAuditResponse({ data: audit }), audit);
  assert.deepEqual(unwrapAuditResponse({ output: audit }), audit);
  assert.deepEqual(unwrapAuditResponse({ body: audit }), audit);
});

test("unwrapAuditResponse accepts Lamatic executeWorkflow wrappers", () => {
  assert.deepEqual(
    unwrapAuditResponse({
      data: {
        executeWorkflow: {
          status: "success",
          result: audit
        }
      }
    }),
    audit
  );
});

test("unwrapAuditResponse accepts JSON string wrappers", () => {
  assert.deepEqual(unwrapAuditResponse({ output: JSON.stringify(audit) }), audit);
});

test("unwrapAuditResponse accepts nested wrappers", () => {
  assert.deepEqual(unwrapAuditResponse({ result: { data: { output: JSON.stringify(audit) } } }), audit);
});

test("unwrapAuditResponse normalizes missing detectedSignals from preflight", () => {
  const { detectedSignals, ...withoutSignals } = audit;
  assert.deepEqual(unwrapAuditResponse({ result: withoutSignals }, detectedSignals), audit);
});

test("unwrapAuditResponse strips Lamatic transport request ids", () => {
  assert.deepEqual(unwrapAuditResponse({ result: { ...audit, requestId: "lamatic-request-id" } }), audit);
});

test("unwrapAuditResponse strips known Lamatic transport metadata", () => {
  assert.deepEqual(
    unwrapAuditResponse({
      data: {
        executeWorkflow: {
          status: "success",
          result: {
            ...audit,
            requestId: "lamatic-request-id",
            traceId: "trace-id",
            latencyMs: 100,
            modelVersion: "model-version"
          }
        }
      }
    }),
    audit
  );
});

test("unwrapAuditResponse normalizes recommended fix enum casing", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "medium",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps."
      }
    ],
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: " Medium ",
        launchImpact: "High"
      },
      {
        priority: 2,
        fix: "Add one lightweight operator checklist.",
        estimatedEffort: "Low",
        launchImpact: "Medium"
      },
      {
        priority: 3,
        fix: "Rework the launch checklist across the Flow and handoff docs.",
        estimatedEffort: "High",
        launchImpact: "Low"
      }
    ]
  };
  assert.deepEqual(unwrapAuditResponse({ result: response }), {
    ...response,
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: "medium",
        launchImpact: "high"
      },
      {
        priority: 2,
        fix: "Add one lightweight operator checklist.",
        estimatedEffort: "small",
        launchImpact: "medium"
      },
      {
        priority: 3,
        fix: "Rework the launch checklist across the Flow and handoff docs.",
        estimatedEffort: "large",
        launchImpact: "low"
      }
    ]
  });
});

test("unwrapAuditResponse normalizes free-form launch impact by ranked priority", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "high",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps."
      }
    ],
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: "small",
        launchImpact: "Closes the first-week support gap and enables repeatable incident triage."
      }
    ]
  };

  assert.deepEqual(unwrapAuditResponse({ result: response }), {
    ...response,
    recommendedFixes: [
      {
        ...response.recommendedFixes[0],
        launchImpact: "high"
      }
    ]
  });
});

test("unwrapAuditResponse derives free-form launch impact without trusting ambiguous enum words", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "high",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps."
      }
    ],
    recommendedFixes: [
      {
        priority: 2,
        fix: "Document the validation steps.",
        estimatedEffort: "small",
        launchImpact: "Not high until operators can repeat the setup."
      },
      {
        priority: 4,
        fix: "Add a supporting operator note.",
        estimatedEffort: "small",
        launchImpact: "Low to medium impact depending on the handoff."
      }
    ]
  };

  assert.deepEqual(unwrapAuditResponse({ result: response }), {
    ...response,
    recommendedFixes: [
      {
        ...response.recommendedFixes[0],
        launchImpact: "medium"
      },
      {
        ...response.recommendedFixes[1],
        launchImpact: "low"
      }
    ]
  });
});

test("unwrapAuditResponse rejects free-form launch impact without a valid ranked priority", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "high",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps."
      }
    ],
    recommendedFixes: [
      {
        priority: 0,
        fix: "Document the validation steps.",
        estimatedEffort: "small",
        launchImpact: "Closes the first-week support gap."
      }
    ]
  };

  assert.equal(unwrapAuditResponse({ result: response }), null);
  assert.equal(
    unwrapAuditResponse({
      result: {
        ...response,
        recommendedFixes: [{ ...response.recommendedFixes[0], priority: 1, launchImpact: "" }]
      }
    }),
    null
  );
});

test("unwrapAuditResponse rejects unknown enum-like launch impact tokens", () => {
  const response = {
    ...audit,
    recommendedFixes: [{
      priority: 1,
      fix: "Document the validation steps.",
      estimatedEffort: "small",
      launchImpact: "urgent"
    }]
  };

  assert.equal(unwrapAuditResponse({ result: response }), null);
});

test("unwrapAuditResponse still rejects unexpected audit fields", () => {
  assert.equal(unwrapAuditResponse({ result: { ...audit, unexpected: "field" } }), null);
});

test("unwrapAuditResponse strips known transport metadata from recommended fixes", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "medium",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps."
      }
    ],
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: "medium",
        launchImpact: "high",
        requestId: "lamatic-request-id",
        latencyMs: 100
      }
    ]
  };
  assert.deepEqual(unwrapAuditResponse({ result: response }), {
    ...response,
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: "medium",
        launchImpact: "high"
      }
    ]
  });
});

test("unwrapAuditResponse rejects unrecognized effort aliases", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "medium",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps."
      }
    ],
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: "tiny",
        launchImpact: "medium"
      }
    ]
  };
  assert.equal(unwrapAuditResponse({ result: response }), null);
});

test("unwrapAuditResponse rejects malformed JSON string wrappers", () => {
  assert.equal(unwrapAuditResponse({ result: "{ bad json" }), null);
});

test("unwrapAuditResponse replaces malformed model detectedSignals with preflight signals", () => {
  assert.deepEqual(
    unwrapAuditResponse(
      {
        result: {
          ...audit,
          detectedSignals: {
            hasEnoughContext: true,
            envLikeTokens: [],
            categorySignals: {}
          }
        }
      },
      audit.detectedSignals
    ),
    audit
  );
});

test("unwrapAuditResponse replaces valid but stale model detectedSignals with preflight signals", () => {
  const staleSignals = {
    hasEnoughContext: true,
    envLikeTokens: ["STALE_ENV"],
    categorySignals: Object.fromEntries(Object.entries(audit.detectedSignals.categorySignals).map(([key]) => [key, ["stale"]]))
  };

  assert.deepEqual(unwrapAuditResponse({ result: { ...audit, detectedSignals: staleSignals } }, audit.detectedSignals), audit);
});

test("unwrapAuditResponse rejects metadata added inside findings", () => {
  const response = {
    ...audit,
    launchDecision: "needs-review",
    confidence: "medium",
    topRisks: ["Setup docs need review"],
    findings: [
      {
        category: "env-and-setup-docs",
        severity: "medium",
        title: "Setup docs need review",
        evidence: "The brief names setup docs but not validation steps.",
        whyItMatters: "Operators need repeatable setup before go-live.",
        recommendedFix: "Document the validation steps.",
        requestId: "not-a-transport-wrapper"
      }
    ],
    recommendedFixes: [
      {
        priority: 1,
        fix: "Document the validation steps.",
        estimatedEffort: "medium",
        launchImpact: "high"
      }
    ]
  };

  assert.equal(unwrapAuditResponse({ result: response }), null);
});

test("unwrapAuditResponse skips partial wrapper candidates", () => {
  const partial = {
    launchDecision: "ready",
    findings: [],
    recommendedFixes: []
  };
  assert.deepEqual(unwrapAuditResponse({ result: partial, data: audit }), audit);
});

test("unwrapAuditResponse rejects unrelated payloads", () => {
  assert.equal(unwrapAuditResponse({ result: { message: "ok" } }), null);
});

test("unwrapAuditResponse rejects circular wrappers", () => {
  const circular = {};
  circular.result = circular;
  assert.equal(unwrapAuditResponse(circular), null);
});

test("isAuditResponse rejects partial response shapes", () => {
  assert.equal(isAuditResponse({ launchDecision: "ready", findings: [], recommendedFixes: [] }), false);
  assert.equal(isAuditResponse({ ...audit, launchDecision: "ready", confidence: "low" }), false);
  assert.equal(isAuditResponse({ ...audit, launchDecision: "needs-review", confidence: "low" }), false);
  assert.equal(isAuditResponse({ ...audit, summary: "X" }), false);
  assert.equal(isAuditResponse({ ...audit, topRisks: [1] }), false);
  assert.equal(isAuditResponse({ ...audit, detectedSignals: { hasEnoughContext: true } }), false);
  assert.equal(isAuditResponse(audit), true);
});

test("isAuditResponse accepts high or medium confidence for not-enough-context", () => {
  const thinResponse = {
    launchDecision: "not-enough-context",
    confidence: "high",
    summary: "There is not enough context to audit launch readiness yet.",
    detectedSignals: {
      hasEnoughContext: false,
      envLikeTokens: [],
      categorySignals: audit.detectedSignals.categorySignals
    },
    topRisks: [],
    findings: [],
    recommendedFixes: [],
    questionsToContinue: ["What customer problem does this Flow solve?", "What are the trigger and expected output?"]
  };

  assert.equal(isAuditResponse(thinResponse), true);
  assert.equal(isAuditResponse({ ...thinResponse, confidence: "medium" }), true);
  assert.equal(isAuditResponse({ ...thinResponse, confidence: "low" }), false);
  assert.equal(
    isAuditResponse({
      ...thinResponse,
      detectedSignals: {
        ...thinResponse.detectedSignals,
        hasEnoughContext: true
      }
    }),
    false
  );
});

test("isAuditResponse requires high confidence for not-ready decisions", () => {
  const notReady = {
    ...audit,
    launchDecision: "not-ready",
    confidence: "high",
    topRisks: ["No launch evals are documented"],
    findings: [
      {
        category: "evals-and-tests",
        severity: "high",
        title: "No launch evals are documented",
        evidence: "The brief does not list launch evals or acceptance criteria.",
        whyItMatters: "Customer-visible regressions can reach production without a launch gate.",
        recommendedFix: "Add representative evals before go-live."
      }
    ],
    recommendedFixes: [
      {
        priority: 1,
        fix: "Add representative evals before go-live.",
        estimatedEffort: "medium",
        launchImpact: "high"
      }
    ]
  };

  assert.equal(isAuditResponse(notReady), true);
  assert.equal(isAuditResponse({ ...notReady, confidence: "medium" }), false);
});

test("isAuditResponse counts string length by Unicode code point like JSON schema", () => {
  assert.equal(isAuditResponse({ ...audit, summary: "👍".repeat(500) }), true);
  assert.equal(isAuditResponse({ ...audit, summary: "👍".repeat(501) }), false);
});

test("isAuditResponse rejects extra properties forbidden by the JSON schema", () => {
  assert.equal(isAuditResponse({ ...audit, extra: "field" }), false);
  assert.equal(
    isAuditResponse({
      ...audit,
      detectedSignals: {
        ...audit.detectedSignals,
        extra: "field"
      }
    }),
    false
  );
  assert.equal(
    isAuditResponse({
      ...audit,
      detectedSignals: {
        ...audit.detectedSignals,
        categorySignals: {
          ...audit.detectedSignals.categorySignals,
          extra: []
        }
      }
    }),
    false
  );
  assert.equal(
    isAuditResponse({
      ...audit,
      findings: [
        {
          category: "evals-and-tests",
          severity: "low",
          title: "Document eval sample",
          evidence: "One low-severity documentation gap remains.",
          whyItMatters: "It helps operators reproduce the launch check.",
          recommendedFix: "Add one sample eval note.",
          extra: "field"
        }
      ]
    }),
    false
  );
  assert.equal(
    isAuditResponse({
      ...audit,
      launchDecision: "needs-review",
      confidence: "medium",
      topRisks: ["Missing eval sample"],
      findings: [
        {
          category: "evals-and-tests",
          severity: "medium",
          title: "Document eval sample",
          evidence: "One launch eval gap remains.",
          whyItMatters: "It helps operators reproduce the launch check.",
          recommendedFix: "Add one sample eval note."
        }
      ],
      recommendedFixes: [
        {
          priority: 1,
          fix: "Add one sample eval note.",
          estimatedEffort: "small",
          launchImpact: "medium",
          extra: "field"
        }
      ]
    }),
    false
  );
});

test("parseLamaticTimeoutMs falls back on invalid values", () => {
  assert.equal(parseLamaticTimeoutMs("3000"), 3000);
  assert.equal(parseLamaticTimeoutMs("120000"), 120000);
  assert.equal(parseLamaticTimeoutMs("30"), 60000);
  assert.equal(parseLamaticTimeoutMs("30s"), 60000);
  assert.equal(parseLamaticTimeoutMs(""), 60000);
  assert.equal(parseLamaticTimeoutMs(null), 60000);
  assert.equal(parseLamaticTimeoutMs(undefined), 60000);
  assert.equal(parseLamaticTimeoutMs(Infinity), 60000);
  assert.equal(parseLamaticTimeoutMs("-1"), 60000);
  assert.equal(parseLamaticTimeoutMs("120001"), 60000);
});

test("parseLamaticApiUrl requires HTTPS URLs", () => {
  assert.equal(parseLamaticApiUrl("https://local-test.lamatic.dev/flows/run"), "https://local-test.lamatic.dev/flows/run");
  assert.equal(parseLamaticApiUrl("https://lucerosorganization764-lucerosproject363.lamatic.dev/"), "https://lucerosorganization764-lucerosproject363.lamatic.dev/");
  assert.throws(() => parseLamaticApiUrl("http://local-test.lamatic.dev/flows/run"), LamaticClientError);
  assert.throws(() => parseLamaticApiUrl("https://lamatic.example.test/flows/run"), LamaticClientError);
  assert.throws(() => parseLamaticApiUrl("https://evil.example.test/flows/run"), LamaticClientError);
  assert.throws(() => parseLamaticApiUrl("not a url"), LamaticClientError);
});

test("hasLamaticConfig rejects placeholder values", () => {
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";
  for (const placeholder of [
    "replace-with-lamatic-api-url",
    "replace_me",
    "replace-me",
    "TODO",
    "TBD",
    "changeme",
    "changeme123",
    "change-me",
    "placeholder",
    "replace_with_lamatic_api_url",
    "update_me",
    "fill_this_in",
    "null",
    "undefined",
    "default"
  ]) {
    process.env.LAMATIC_API_URL = placeholder;
    assert.equal(hasLamaticConfig(), false);
  }

  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  assert.equal(hasLamaticConfig(), true);
  process.env.LAMATIC_API_URL = "your-api-url-here";
  assert.equal(hasLamaticConfig(), false);
  process.env.LAMATIC_API_URL = "xxx";
  assert.equal(hasLamaticConfig(), true);
});

test("callLamaticFlow accepts valid wrapped audit responses", async () => {
  configureLamaticEnv();
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://local-test.lamatic.dev/flows/run");
    assert.equal(options.method, "POST");
    assert.equal(options.headers.Authorization, "Bearer test-key");
    assert.equal(options.headers["x-project-id"], "test-project");
    assert.equal(options.redirect, "error");
    assert.deepEqual(JSON.parse(options.body), {
      query: `
  query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
    executeWorkflow(workflowId: $workflowId, payload: $payload) {
      status
      result
    }
  }
`,
      variables: {
        workflowId: "flow-launch-auditor",
        payload: {
          flowBrief: "brief",
          optionalFlowExport: "",
          detectedSignals: audit.detectedSignals
        }
      }
    });
    return new Response(
      JSON.stringify({
        data: {
          executeWorkflow: {
            status: "success",
            result: audit
          }
        }
      }),
      { status: 200 }
    );
  };

  assert.deepEqual(await callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }), audit);
});

test("callLamaticFlow surfaces GraphQL error envelopes", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ errors: [{ message: "Workflow not found" }] }), { status: 200 });

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) =>
      error instanceof LamaticClientError &&
      error.code === "graphql" &&
      error.message.includes("Workflow not found")
  );
});

test("callLamaticFlow treats non-object GraphQL errors as safe GraphQL failures", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ errors: ["Workflow not found"] }), { status: 200 });

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) =>
      error instanceof LamaticClientError &&
      error.code === "graphql" &&
      error.message.includes("unknown GraphQL error") &&
      !error.message.includes("Workflow not found")
  );
});

test("callLamaticFlow rejects partial GraphQL error envelopes before using data", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        errors: [{ message: "Partial failure" }],
        data: {
          executeWorkflow: {
            status: "success",
            result: audit
          }
        }
      }),
      { status: 200 }
    );

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) =>
      error instanceof LamaticClientError &&
      error.code === "graphql" &&
      error.message.includes("Partial failure")
  );
});

test("callLamaticFlow surfaces non-success workflow execution status", async () => {
  configureLamaticEnv();
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

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) =>
      error instanceof LamaticClientError &&
      error.code === "execution" &&
      error.message.includes("Flow execution failed")
  );
});

test("callLamaticFlow rejects malformed JSON responses", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () => new Response("not json", { status: 200 });

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) => error instanceof LamaticClientError && error.code === "malformed-json"
  );
});

test("callLamaticFlow distinguishes response stream failures from malformed JSON", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      throw new TypeError("response stream failed");
    }
  });

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) => error instanceof LamaticClientError && error.code === "response-read"
  );
});

test("callLamaticFlow cancels non-OK response bodies", async () => {
  configureLamaticEnv();
  let cancelled = false;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return (
    new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("rate limited"));
        },
        cancel() {
          cancelled = true;
        }
      }),
      { status: 429 }
    ));
  };

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) => error instanceof LamaticClientError && error.code === "http" && error.status === 429
  );
  assert.equal(cancelled, true);
  assert.equal(fetchCount, 1);
});

test("callLamaticFlow does not replay executeWorkflow after a transient HTTP response", async () => {
  configureLamaticEnv();
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response("cold start", { status: 503 });
  };

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) => error instanceof LamaticClientError && error.code === "http" && error.status === 503
  );
  assert.equal(fetchCount, 1);
});

test("callLamaticFlow maps aborts to timeout errors", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () => {
    const error = new Error("aborted");
    error.name = "AbortError";
    throw error;
  };

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) => error instanceof LamaticClientError && error.code === "timeout"
  );
});

test("callLamaticFlow maps body-read aborts to timeout errors", async () => {
  configureLamaticEnv();
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => {
      const error = new Error("aborted while reading body");
      error.name = "AbortError";
      throw error;
    }
  });

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }),
    (error) => error instanceof LamaticClientError && error.code === "timeout"
  );
});

test("callLamaticFlow aborts when the incoming request is aborted", async () => {
  configureLamaticEnv();
  const incoming = new AbortController();
  let fetchSawAbort = false;
  globalThis.fetch = async (_url, options) =>
    new Promise((_resolve, reject) => {
      options.signal.addEventListener(
        "abort",
        () => {
          fetchSawAbort = true;
          const error = new Error("aborted by request");
          error.name = "AbortError";
          reject(error);
        },
        { once: true }
      );
      incoming.abort();
    });

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }, incoming.signal),
    (error) => error instanceof LamaticClientError && error.code === "aborted"
  );
  assert.equal(fetchSawAbort, true);
});

test("callLamaticFlow does not start fetch when the incoming request is already aborted", async () => {
  configureLamaticEnv();
  const incoming = new AbortController();
  incoming.abort();
  globalThis.fetch = async () => {
    throw new Error("fetch should not start for an already-aborted request");
  };

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }, incoming.signal),
    (error) => error instanceof LamaticClientError && error.code === "aborted"
  );
});

test("callLamaticFlow closes the abort race after listener registration", async () => {
  configureLamaticEnv();
  let abortedReads = 0;
  let fetchStarted = false;
  const raceSignal = {
    get aborted() {
      abortedReads += 1;
      return abortedReads >= 2;
    },
    addEventListener() {},
    removeEventListener() {}
  };
  globalThis.fetch = async () => {
    fetchStarted = true;
    throw new Error("fetch should not start after the abort race is detected");
  };

  await assert.rejects(
    () => callLamaticFlow({ flowBrief: "brief", optionalFlowExport: "", detectedSignals: audit.detectedSignals }, raceSignal),
    (error) => error instanceof LamaticClientError && error.code === "aborted"
  );
  assert.equal(fetchStarted, false);
});

function configureLamaticEnv() {
  process.env.LAMATIC_API_URL = "https://local-test.lamatic.dev/flows/run";
  process.env.LAMATIC_API_KEY = "test-key";
  process.env.LAMATIC_PROJECT_ID = "test-project";
  process.env.LAMATIC_FLOW_ID = "flow-launch-auditor";
}

function restoreLamaticEnv() {
  for (const name of lamaticEnv) {
    if (originalLamaticEnv[name] === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = originalLamaticEnv[name];
    }
  }
}

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { buildNotEnoughContextResponse, extractDetectedSignals } from "../lib/preflight.js";
import { isAuditResponse } from "../lib/audit-response.js";
import { buildMockAuditResponse } from "../lib/mock-audit.js";

const goodBrief = `A customer support team wants a Lamatic Flow that classifies inbound billing emails before they reach the human support queue.
The Flow is triggered by a webhook and receives ticket text, customer tier, and ticket ID. The model returns a JSON category and calls a read-only billing API with BILLING_API_KEY.
If the API call times out, the Flow falls back to email-only classification. The README lists LAMATIC_API_KEY and LAMATIC_FLOW_ID, .env.example has placeholders, fixtures cover five sample tickets, and logs include ticket ID, category, confidence, and API success without logging the full body.`;
const fragileFixtureUrl = new URL("./fixtures/fragile-flow-launch-risks.json", import.meta.url);

test("thin briefs fail preflight with questions", () => {
  const signals = extractDetectedSignals("We need an AI onboarding helper. Please audit it.", "");
  assert.equal(signals.hasEnoughContext, false);

  const response = buildNotEnoughContextResponse(signals);
  assert.equal(response.launchDecision, "not-enough-context");
  assert.equal(response.confidence, "high");
  assert.equal(response.questionsToContinue.length, 3);
  assert.deepEqual(response.findings, []);
});

test("preflight extracts category signals and env-like tokens", () => {
  const signals = extractDetectedSignals(goodBrief, "tool: billing API");
  assert.equal(signals.hasEnoughContext, true);
  assert.deepEqual(signals.envLikeTokens, ["BILLING_API_KEY", "LAMATIC_API_KEY", "LAMATIC_FLOW_ID"]);
  assert.ok(signals.categorySignals["evals-and-tests"].includes("fixtures"));
  assert.ok(signals.categorySignals["tool-boundaries"].includes("webhook"));
  assert.ok(signals.categorySignals["failure-paths"].includes("falls back"));
});

test("preflight uses optional flow export and common plurals for context gating", () => {
  const signals = extractDetectedSignals(
    "A customer support team needs help triaging billing requests before go-live. Users need a reliable handoff so urgent account issues reach the right queue during launch week, with clear ownership for first-week support.",
    "Flows have webhook triggers, inputs, outputs, models, tools, APIs, and steps that return support classifications with launch context. ".repeat(2)
  );

  assert.equal(signals.hasEnoughContext, true);
  assert.ok(signals.categorySignals["tool-boundaries"].includes("webhook"));
});

test("preflight catches common failure and privacy variants", () => {
  const signals = extractDetectedSignals(
    "A customer support team has a Flow where the billing API call times out, becomes rate limited, or logs the full-email-body. The model returns a queue decision from the webhook trigger.",
    ""
  );

  assert.equal(signals.hasEnoughContext, true);
  assert.ok(signals.categorySignals["failure-paths"].includes("times out"));
  assert.ok(signals.categorySignals["failure-paths"].includes("rate limited"));
  assert.ok(signals.categorySignals["security-and-privacy"].includes("full email body"));
});

test("preflight catches plural observability terms", () => {
  const signals = extractDetectedSignals(
    "A customer support team has a Lamatic Flow where the webhook trigger sends the model output to support. Logs include run ID, traces, metrics, and queue category so launch operators can debug the first week.",
    ""
  );

  assert.equal(signals.hasEnoughContext, true);
  assert.ok(signals.categorySignals["observability-and-logging"].includes("logs"));
  assert.ok(signals.categorySignals["observability-and-logging"].includes("traces"));
  assert.ok(signals.categorySignals["observability-and-logging"].includes("metrics"));
});

test("preflight only flags concrete cost and latency terms", () => {
  const genericSignals = extractDetectedSignals(
    "A customer support team needs a Flow where the webhook trigger sends text to a model and returns context for the output queue. ".repeat(2),
    ""
  );
  assert.equal(genericSignals.hasEnoughContext, true);
  assert.deepEqual(genericSignals.categorySignals["cost-and-latency"], []);

  const concreteSignals = extractDetectedSignals(
    "A customer support team has a Lamatic Flow where the webhook trigger sends the model output to support. The launch notes mention high volume, caching, latency, and token budget limits.",
    ""
  );
  assert.equal(concreteSignals.hasEnoughContext, true);
  assert.ok(concreteSignals.categorySignals["cost-and-latency"].includes("high volume"));
  assert.ok(concreteSignals.categorySignals["cost-and-latency"].includes("latency"));
  assert.ok(concreteSignals.categorySignals["cost-and-latency"].includes("token budget"));
});

test("preflight avoids substring false positives and catches env variants", () => {
  const falsePositiveSignals = extractDetectedSignals(
    "A customer team has a Flow where an author capitalizes event conventions for documentation. The model returns output from the trigger step.",
    ""
  );

  assert.equal(falsePositiveSignals.categorySignals["tool-boundaries"].includes("api"), false);
  assert.equal(falsePositiveSignals.categorySignals["tool-boundaries"].includes("env"), false);
  assert.equal(falsePositiveSignals.categorySignals["security-and-privacy"].includes("auth"), false);

  const envSignals = extractDetectedSignals(
    "A customer team has a Flow where the model calls an API from a webhook trigger and returns output.",
    "PASSWORD HOST PORT DEBUG ENV X_API"
  );
  assert.deepEqual(envSignals.envLikeTokens, ["PASSWORD", "HOST", "PORT", "DEBUG", "ENV", "X_API"]);
});

test("preflight requires customer problem evidence in the flow brief", () => {
  const signals = extractDetectedSignals(
    "Flow.",
    "The exported workflow includes trigger inputs outputs models tools API webhook steps return classify calls. ".repeat(4)
  );

  assert.equal(signals.hasEnoughContext, false);
});

test("mock audit preserves detectedSignals exactly", () => {
  const detectedSignals = extractDetectedSignals(goodBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief: goodBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.deepEqual(audit.detectedSignals, detectedSignals);
  assert.equal(audit.questionsToContinue.length, 0);
});

test("mock audit returns not-enough-context when called with thin detected signals", () => {
  const detectedSignals = extractDetectedSignals("Please audit my helper.", "");
  const audit = buildMockAuditResponse({
    flowBrief: "Please audit my helper.",
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.launchDecision, "not-enough-context");
  assert.equal(isAuditResponse(audit), true);
  assert.deepEqual(audit.findings, []);
  assert.equal(audit.questionsToContinue.length, 3);
});

test("mock audit flags launch blockers from weak evidence", () => {
  const riskyBrief = `A customer wants a Lamatic Flow for billing support. The Flow trigger is a webhook, then a model calls an API and returns a queue decision.
There are no tests, no retry behavior, the token is pasted into node configuration, and logs full email body content for debugging before launch.`;
  const detectedSignals = extractDetectedSignals(riskyBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief: riskyBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.launchDecision, "not-ready");
  assert.equal(audit.confidence, "high");
  assert.ok(audit.findings.some((finding) => finding.category === "security-and-privacy"));
});

test("mock audit flags hardcoded API key language as unsafe secret handling", () => {
  const riskyBrief = `A customer support team uses a Lamatic Flow for billing support. The Flow trigger is a webhook, then a model calls an API and returns a queue decision.
Evals include fixtures and assertions. Failure paths include retry, timeout, and fallback. README includes setup and env guidance. Logs include run ID and metrics.
The flow has a hardcoded-api-key before launch.`;
  const detectedSignals = extractDetectedSignals(riskyBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief: riskyBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.launchDecision, "not-ready");
  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.category === "security-and-privacy"));
});

test("mock audit avoids substring false positives for security trigger phrases", () => {
  const flowBrief = `A customer team has a blog everything page for a Lamatic onboarding flow. The Flow uses a webhook trigger and returns output from a model.
Evals include fixtures and assertions. Failure paths cover retry, fallback, timeout, and exceptions. README includes setup and env guidance. Logs include metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.findings.some((finding) => finding.category === "security-and-privacy"), false);
});

test("mock audit handles fragile fixture negative evidence", () => {
  const request = JSON.parse(
    fs.readFileSync(fragileFixtureUrl, "utf8")
  );
  const detectedSignals = extractDetectedSignals(request.flowBrief, request.optionalFlowExport);
  assert.deepEqual(detectedSignals, request.detectedSignals);
  const audit = buildMockAuditResponse({
    flowBrief: request.flowBrief,
    optionalFlowExport: request.optionalFlowExport,
    detectedSignals
  });

  assert.equal(audit.launchDecision, "not-ready");
  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.category === "security-and-privacy"));
  assert.ok(audit.findings.some((finding) => finding.category === "evals-and-tests"));
  assert.ok(audit.findings.some((finding) => finding.category === "failure-paths"));
  assert.ok(audit.findings.some((finding) => finding.category === "env-and-setup-docs"));
});

test("mock audit keeps mixed observability evidence when production logging is present", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The Flow trigger is a webhook and the model calls a read-only API before returning a queue decision.
Evals include fixtures. Retry, fallback, and timeout behavior are documented. README setup includes env guidance. Logging is absent from staging but present in production with run IDs and metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({ flowBrief, optionalFlowExport: "", detectedSignals });

  assert.equal(
    audit.findings.some((finding) => finding.category === "observability-and-logging"),
    false
  );
});

test("mock audit rejects negated eval and observability controls as positive evidence", () => {
  const cases = [
    ["Tests are not implemented.", "evals-and-tests"],
    ["The Flow does not implement tests.", "evals-and-tests"],
    ["Metrics are not logged.", "observability-and-logging"],
    ["The Flow does not log metrics.", "observability-and-logging"]
  ];

  for (const [negatedEvidence, expectedCategory] of cases) {
    const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The webhook trigger sends each request to a read-only API and a model returns a queue decision.
${negatedEvidence} Retry, fallback, and timeout behavior are documented. README setup includes env guidance. Sensitive data is redacted.`;
    const detectedSignals = extractDetectedSignals(flowBrief, "");
    const audit = buildMockAuditResponse({ flowBrief, optionalFlowExport: "", detectedSignals });

    assert.ok(
      audit.findings.some((finding) => finding.category === expectedCategory),
      `${negatedEvidence} must not satisfy ${expectedCategory}`
    );
  }
});

test("mock audit does not treat an ambiguous category mention as positive evidence", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The webhook trigger sends each request to a read-only API and a model returns a queue decision.
Evals are something we should add later. Retry, fallback, and timeout behavior are documented. README setup includes env guidance. Logs capture run IDs and metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({ flowBrief, optionalFlowExport: "", detectedSignals });

  assert.ok(detectedSignals.categorySignals["evals-and-tests"].includes("evals"));
  assert.ok(audit.findings.some((finding) => finding.category === "evals-and-tests"));
});

test("mock audit flags missing tool boundaries", () => {
  const flowBrief = `A customer team needs a Lamatic Flow for onboarding. The Flow trigger receives a form submission and the model returns a checklist.
The README includes setup guidance and config notes. Evals include fixtures and assertions. Failure paths include retry, timeout, and fallback. Logs include run ID and metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.launchDecision, "needs-review");
  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.category === "tool-boundaries"));
});

test("mock audit flags explicit negative evidence for tool boundaries", () => {
  const flowBrief = `A customer team needs a Lamatic Flow for onboarding. The Flow trigger receives form submissions and the model returns a checklist.
There are no tools, APIs, webhooks, integrations, or tool boundaries documented. The README includes setup guidance and config notes.
Evals include fixtures and assertions. Failure paths include retry, timeout, and fallback. Logs include run ID and metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.title === "Tool and API boundaries are explicitly missing"));
});

test("mock audit flags missing security and privacy posture", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The Flow trigger is a webhook and the model calls a read-only API tool integration.
Evals include test fixtures, assertions, sample cases, and a golden path. Failure behavior covers retry, fallback, timeout, rate limit, and exceptions.
README setup includes env, .env.example, and config. Logs include trace, monitor, metric, debug, and audit trail. Cost evidence covers cache, model, context, parallel steps, and latency.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.launchDecision, "needs-review");
  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.title === "Security and privacy posture is not visible"));
});

test("mock audit flags explicit negative evidence for security and privacy controls", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The Flow trigger is a webhook and the model calls a read-only API tool integration.
Evals include test fixtures, assertions, sample cases, and a golden path. Failure behavior covers retry, fallback, timeout, rate limit, and exceptions.
README setup includes env, .env.example, and config. Logs include trace, monitor, metric, debug, and audit trail. Cost evidence covers cache, model, context, parallel steps, and latency.
There are no privacy controls, no authentication, no token storage, and no redaction documented before launch.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.title === "Security and privacy controls are explicitly missing"));
});

test("mock audit does not treat token budget language as security evidence", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The Flow trigger is a webhook and the model calls a read-only API tool integration.
Evals include test fixtures, assertions, sample cases, and a golden path. Failure behavior covers retry, fallback, timeout, rate limit, and exceptions.
README setup includes env, .env.example, and config. Logs include trace, monitor, metric, debug, and audit trail. Cost evidence covers cache, model, context, parallel steps, latency, and token budget.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.title === "Security and privacy posture is not visible"));
});

test("mock audit treats does-not-include wording as negative evidence", () => {
  const flowBrief = `A customer team needs a Lamatic Flow for onboarding. The Flow trigger receives a form submission and the model returns a checklist.
The README includes setup guidance and config notes. Evals include fixtures and assertions. Failure behavior does not include retry, fallback, timeout, or error handling. Logs include run ID and metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.category === "failure-paths"));
});

test("mock audit treats there-are-no wording as negative evidence", () => {
  const flowBrief = `A customer team needs a Lamatic Flow for onboarding. The Flow trigger receives a form submission and the model returns a checklist for support operators.
There are no tests, there are no fixtures, and there are no evals. Failure paths include retry, timeout, and fallback. README includes setup and env guidance. Logs include run ID and metrics. Sensitive data is redacted.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.category === "evals-and-tests"));
});

test("mock audit can produce a cost and latency finding from explicit negative evidence", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow where the webhook trigger sends each request to a model and returns a queue decision.
Evals include fixtures and assertions. Failure behavior covers retry, fallback, timeout, and exceptions. README setup includes env and config. Logs include trace and metrics. Sensitive data is redacted.
The launch notes say there is no latency budget, no caching, and cost is not documented for expected high volume.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(isAuditResponse(audit), true);
  assert.ok(audit.findings.some((finding) => finding.category === "cost-and-latency"));
});

test("mock audit can produce a ready schema-shaped response", () => {
  const flowBrief = `A customer support team uses a Lamatic Flow for billing classification. The Flow trigger is a webhook and the model calls a read-only API tool integration.
Evals include test fixtures, assertions, sample cases, and a golden path. Failure behavior covers retry, fallback, timeout, rate limit, and exceptions.
Privacy controls cover PII, auth, token handling, encryption, permissions, and redaction. README setup includes env, .env.example, and config. Logs include trace, monitor, metric, debug, and audit trail. Cost evidence covers cache, model, context, parallel steps, and latency.`;
  const detectedSignals = extractDetectedSignals(flowBrief, "");
  const audit = buildMockAuditResponse({
    flowBrief,
    optionalFlowExport: "",
    detectedSignals
  });

  assert.equal(audit.launchDecision, "ready");
  assert.equal(audit.confidence, "high");
  assert.deepEqual(audit.topRisks, []);
  assert.deepEqual(audit.findings, []);
  assert.deepEqual(audit.recommendedFixes, []);
  assert.equal(isAuditResponse(audit), true);
});

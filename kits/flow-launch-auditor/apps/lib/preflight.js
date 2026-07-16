import { categories } from "./categories.js";
import { normalizeText, normalizeWhitespace } from "./text-normalize.js";

export { categories };

const categoryKeywords = {
  "evals-and-tests": [
    "eval",
    "evals",
    "test",
    "tests",
    "assert",
    "assertion",
    "assertions",
    "fixture",
    "fixtures",
    "sample",
    "samples",
    "golden path"
  ],
  "tool-boundaries": ["tool", "api", "webhook", "web hook", "web-hook", "credential", "integration"],
  "failure-paths": [
    "retry",
    "fallback",
    "falls back",
    "error",
    "timeout",
    "times out",
    "timed out",
    "rate limit",
    "rate limited",
    "rate-limit",
    "rate-limited",
    "time-out",
    "fall-back",
    "exception"
  ],
  "security-and-privacy": [
    "pii",
    "auth",
    "authentication",
    "authorization",
    "secret",
    "token handling",
    "token storage",
    "token management",
    "credential handling",
    "credential storage",
    "credential management",
    "encryption",
    "permission",
    "privacy",
    "sensitive",
    "redact",
    "must not include",
    "full email body"
  ],
  "env-and-setup-docs": ["readme", "setup", "env", ".env.example", "config"],
  "observability-and-logging": [
    "log",
    "logs",
    "logging",
    "trace",
    "traces",
    "monitor",
    "monitoring",
    "metric",
    "metrics",
    "debug",
    "audit trail",
    "observability"
  ],
  "cost-and-latency": [
    "batch",
    "loop",
    "per row",
    "cache",
    "model choice",
    "oversized context",
    "large context",
    "parallel",
    "serial",
    "latency",
    "cost",
    "token budget",
    "high volume",
    "high-volume",
    "throughput"
  ]
};

const problemWords = [
  "customer",
  "customers",
  "team",
  "teams",
  "user",
  "users",
  "workflow",
  "workflows",
  "problem",
  "problems",
  "support",
  "onboarding",
  "use case",
  "use cases",
  "launch"
];

const workflowWords = [
  "flow",
  "flows",
  "trigger",
  "triggers",
  "input",
  "inputs",
  "output",
  "outputs",
  "model",
  "models",
  "tool",
  "tools",
  "api",
  "apis",
  "webhook",
  "webhooks",
  "step",
  "steps",
  "return",
  "returns",
  "classify",
  "call",
  "calls"
];

export function extractDetectedSignals(flowBrief, optionalFlowExport = "") {
  const brief = normalizeText(flowBrief);
  const rawCombined = `${flowBrief}\n${optionalFlowExport}`;
  const combined = normalizeText(rawCombined);

  return {
    hasEnoughContext: hasEnoughContext(brief, combined),
    envLikeTokens: extractEnvTokens(normalizeWhitespace(rawCombined)),
    categorySignals: Object.fromEntries(
      categories.map((category) => [category, extractCategorySignals(combined, category)])
    )
  };
}

export function hasEnoughContext(normalizedBrief, normalizedWorkflowText = normalizedBrief) {
  if (normalizedBrief.length < 180) {
    return false;
  }
  return includesAny(normalizedBrief, problemWords) && includesAny(normalizedWorkflowText, workflowWords);
}

export function buildNotEnoughContextResponse(detectedSignals) {
  return {
    launchDecision: "not-enough-context",
    confidence: "high",
    summary: "There is not enough context to audit launch readiness yet.",
    detectedSignals,
    topRisks: [],
    findings: [],
    recommendedFixes: [],
    questionsToContinue: [
      "What customer problem does this Flow solve?",
      "What are the trigger, inputs, model/tool steps, and expected output?",
      "What evals, failure behavior, setup notes, and observability expectations exist?"
    ]
  };
}

function includesAny(text, words) {
  return words.some((word) => keywordMatches(text, word));
}

function extractEnvTokens(text) {
  const matches = String(text || "").match(/\b[A-Z][A-Z0-9_]*\b/g) || [];
  const genericTokens = new Set(["API", "URL", "ID", "KEY", "TOKEN", "SECRET", "CONFIG", "PROJECT", "WEBHOOK"]);
  const standaloneEnvTokens = new Set(["PASSWORD", "PASS", "HOST", "PORT", "DEBUG", "ENV"]);
  const candidates = matches.filter(
    (token) =>
      !genericTokens.has(token) &&
      (standaloneEnvTokens.has(token) ||
        token.includes("_") ||
        /(KEY|TOKEN|SECRET|WEBHOOK|URL|CONFIG|PROJECT|PASS|PASSWORD|HOST|PORT|DEBUG|ENV)$/.test(token))
  );
  return [...new Set(candidates)].slice(0, 50);
}

function extractCategorySignals(text, category) {
  const keywords = categoryKeywords[category];
  const matches = keywords.filter((keyword) => keywordMatches(text, keyword));
  return [...new Set(matches)].slice(0, 50);
}

function keywordMatches(text, keyword) {
  const pattern = keyword
    .trim()
    .split(/[ _-]+/)
    .map(escapeRegExp)
    .join("[\\s_-]+");
  const startsWithWord = /^[a-z0-9]/i.test(keyword);
  const endsWithWord = /[a-z0-9]$/i.test(keyword);
  const prefix = startsWithWord ? "\\b" : "";
  const suffix = endsWithWord ? "\\b" : "";
  return new RegExp(`${prefix}${pattern}${suffix}`, "i").test(text);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

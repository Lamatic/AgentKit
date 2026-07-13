import { categories } from "./categories.js";

export { categories };

export const decisions = ["ready", "needs-review", "not-ready", "not-enough-context"];
export const confidenceValues = ["high", "medium"];
export const severities = ["critical", "high", "medium", "low"];
export const efforts = ["small", "medium", "large"];
export const impacts = ["high", "medium", "low"];

const responseKeys = [
  "launchDecision",
  "confidence",
  "summary",
  "detectedSignals",
  "topRisks",
  "findings",
  "recommendedFixes",
  "questionsToContinue"
];
const detectedSignalKeys = ["hasEnoughContext", "envLikeTokens", "categorySignals"];
const findingKeys = ["category", "severity", "title", "evidence", "whyItMatters", "recommendedFix"];
const recommendedFixKeys = ["priority", "fix", "estimatedEffort", "launchImpact"];
const transportMetadataKeys = new Set([
  "requestId",
  "traceId",
  "trace_id",
  "correlationId",
  "correlation_id",
  "executionTimeMs",
  "latencyMs",
  "durationMs",
  "modelVersion",
  "tokenCount"
]);

export function isAuditResponse(value) {
  if (!isRecord(value) || !hasExactKeys(value, responseKeys)) {
    return false;
  }
  if (!decisions.includes(value.launchDecision) || !confidenceValues.includes(value.confidence)) {
    return false;
  }
  if (!isBoundedString(value.summary, 20, 500) || !isDetectedSignals(value.detectedSignals)) {
    return false;
  }
  if (!isStringArray(value.topRisks, 0, 3, 160)) {
    return false;
  }
  if (!Array.isArray(value.findings) || value.findings.length > 5 || !value.findings.every(isFinding)) {
    return false;
  }
  if (
    !Array.isArray(value.recommendedFixes) ||
    value.recommendedFixes.length > 5 ||
    !value.recommendedFixes.every(isRecommendedFix)
  ) {
    return false;
  }
  if (!isStringArray(value.questionsToContinue, 0, 4, 180)) {
    return false;
  }

  if (!value.detectedSignals.hasEnoughContext && value.launchDecision !== "not-enough-context") {
    return false;
  }
  if (value.detectedSignals.hasEnoughContext && value.launchDecision === "not-enough-context") {
    return false;
  }
  if (value.launchDecision === "not-enough-context") {
    return (
      ["high", "medium"].includes(value.confidence) &&
      value.questionsToContinue.length >= 2 &&
      value.topRisks.length === 0 &&
      value.findings.length === 0 &&
      value.recommendedFixes.length === 0
    );
  }
  if (value.questionsToContinue.length > 0) {
    return false;
  }
  if (["needs-review", "not-ready"].includes(value.launchDecision)) {
    if (value.topRisks.length < 1 || value.findings.length < 1 || value.recommendedFixes.length < 1) {
      return false;
    }
  }
  if (value.launchDecision === "ready") {
    return (
      value.confidence === "high" &&
      value.topRisks.length === 0 &&
      value.recommendedFixes.length === 0 &&
      value.findings.length <= 2 &&
      value.findings.every((finding) => finding.severity === "low")
    );
  }
  if (value.launchDecision === "not-ready" && value.confidence !== "high") {
    return false;
  }
  return true;
}

export function normalizeAuditResponse(value, detectedSignals) {
  if (!isRecord(value)) {
    return value;
  }
  const auditValue = stripTransportMetadata(value);
  const normalizedValue = {
    ...auditValue,
    recommendedFixes: normalizeRecommendedFixes(auditValue.recommendedFixes)
  };
  if (!detectedSignals) {
    return normalizedValue;
  }
  return {
    ...normalizedValue,
    detectedSignals
  };
}

function normalizeRecommendedFixes(value) {
  if (!Array.isArray(value)) {
    return value;
  }
  return value.map((fix) => {
    if (!isRecord(fix)) {
      return fix;
    }
    const fixValue = stripTransportMetadata(fix);
    return {
      ...fixValue,
      estimatedEffort: normalizeEffort(fixValue.estimatedEffort),
      launchImpact: normalizeImpact(fixValue.launchImpact, fixValue.priority)
    };
  });
}

function normalizeEffort(value) {
  const normalized = normalizeLowercaseEnum(value);
  // Lamatic models sometimes use impact-style labels for effort; keep the API resilient while the prompt remains stricter.
  if (normalized === "low") {
    return "small";
  }
  if (normalized === "high") {
    return "large";
  }
  return normalized;
}

function normalizeLowercaseEnum(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : value;
}

function normalizeImpact(value, priority) {
  const normalized = normalizeLowercaseEnum(value);
  if (impacts.includes(normalized)) {
    return normalized;
  }
  if (typeof normalized !== "string" || !normalized) {
    return normalized;
  }

  // Preserve resilience for captured prose-shaped Lamatic output, but reject
  // unknown enum-like tokens such as "urgent" so model drift stays visible.
  if (!/\s/.test(normalized)) {
    return normalized;
  }

  if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
    return normalized;
  }
  return priority === 1 ? "high" : priority <= 3 ? "medium" : "low";
}

function stripTransportMetadata(value) {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !transportMetadataKeys.has(key)));
}

function isDetectedSignals(value) {
  return Boolean(
    isRecord(value) &&
      hasExactKeys(value, detectedSignalKeys) &&
      typeof value.hasEnoughContext === "boolean" &&
      isEnvTokenArray(value.envLikeTokens) &&
      isCategorySignals(value.categorySignals)
  );
}

function isCategorySignals(value) {
  if (!isRecord(value) || !hasExactKeys(value, categories)) {
    return false;
  }
  return categories.every((category) => isStringArray(value[category], 0, 50, 160));
}

function isEnvTokenArray(value) {
  return (
    Array.isArray(value) &&
    value.length <= 50 &&
    value.every((token) => isBoundedString(token, 1, 160) && /^[A-Z][A-Z0-9_]*$/.test(token))
  );
}

function isFinding(value) {
  return Boolean(
    isRecord(value) &&
      hasExactKeys(value, findingKeys) &&
      categories.includes(value.category) &&
      severities.includes(value.severity) &&
      isBoundedString(value.title, 1, 120) &&
      isBoundedString(value.evidence, 1, 360) &&
      isBoundedString(value.whyItMatters, 1, 360) &&
      isBoundedString(value.recommendedFix, 1, 300)
  );
}

function isRecommendedFix(value) {
  return Boolean(
    isRecord(value) &&
      hasExactKeys(value, recommendedFixKeys) &&
      Number.isInteger(value.priority) &&
      value.priority >= 1 &&
      value.priority <= 5 &&
      isBoundedString(value.fix, 1, 220) &&
      efforts.includes(value.estimatedEffort) &&
      impacts.includes(value.launchImpact)
  );
}

function isStringArray(value, minItems, maxItems, maxLength) {
  return (
    Array.isArray(value) &&
    value.length >= minItems &&
    value.length <= maxItems &&
    value.every((item) => isBoundedString(item, 1, maxLength))
  );
}

function isBoundedString(value, minLength, maxLength) {
  if (typeof value !== "string") {
    return false;
  }
  const length = Array.from(value).length;
  return length >= minLength && length <= maxLength;
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasExactKeys(value, expectedKeys) {
  const keys = Object.keys(value);
  return keys.length === expectedKeys.length && expectedKeys.every((key) => Object.hasOwn(value, key));
}

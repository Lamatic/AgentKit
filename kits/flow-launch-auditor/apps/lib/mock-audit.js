import { categoryLabels } from "./categories.js";
import { buildNotEnoughContextResponse } from "./preflight.js";
import { normalizeText } from "./text-normalize.js";

const recommendedFixMaxLength = 220;
const securityAndPrivacyEvidencePattern =
  "(privacy(?: controls?)?|security controls?|pii handling|sensitive data|private data|authentication|authorization|auth|secrets?|secret handling|secret storage|secret management|token handling|token storage|token management|credential handling|credential storage|credential management|credentials?|encryption|permissions?|redaction)";
const evalNegativePattern = negativeEvidencePattern("(evals?|tests?|fixtures?|assertions?|test coverage)");
const setupNegativePattern = negativeEvidencePattern(`[\`'"]?(\\.env\\.example|env example|setup|readme|config)`);
const failureNegativePattern = new RegExp(
  `(error behavior is still undecided|failure behavior is still undecided|${negativeEvidencePattern("(retry|fallback|timeout|error handling)").source})`
);
const toolNegativePattern = negativeEvidencePattern(
  "(external\\s+)?(tools?|apis?|webhooks?|integrations?|tool boundaries|api boundaries)"
);
const costNegativePattern = new RegExp(
  `(latency budget is missing|cost budget is missing|${negativeEvidencePattern("(cache|caching|batching|latency|cost|token budget|parallelization|throughput)").source})`
);
const securityNegativePattern = negativeEvidencePattern(securityAndPrivacyEvidencePattern);
const categoryEvidenceTargets = {
  "evals-and-tests": "(evals?|tests?|fixtures?|assertions?|test coverage)",
  "tool-boundaries": "(tools?|apis?|webhooks?|integrations?|tool boundaries|api boundaries)",
  "failure-paths": "(retry|fallback|timeout|error handling)",
  "security-and-privacy": securityAndPrivacyEvidencePattern,
  "env-and-setup-docs": "(\\.env\\.example|env example|setup|readme|config)",
  "observability-and-logging": "(logs?|logging|traces?|metrics?|observability)",
  "cost-and-latency": "(cache|caching|batching|latency|cost|token budget|parallelization|throughput)"
};
const positiveEvidenceByCategory = {
  ...Object.fromEntries(
    Object.entries(categoryEvidenceTargets).map(([category, target]) => [
      category,
      [positiveEvidencePattern(target)]
    ])
  )
};
const negativeEvidenceByCategory = {
  "evals-and-tests": [evalNegativePattern, negatedPositiveEvidencePattern(categoryEvidenceTargets["evals-and-tests"])],
  "tool-boundaries": [toolNegativePattern, negatedPositiveEvidencePattern(categoryEvidenceTargets["tool-boundaries"])],
  "failure-paths": [failureNegativePattern, negatedPositiveEvidencePattern(categoryEvidenceTargets["failure-paths"])],
  "security-and-privacy": [securityNegativePattern],
  "env-and-setup-docs": [setupNegativePattern, negatedPositiveEvidencePattern(categoryEvidenceTargets["env-and-setup-docs"])],
  "observability-and-logging": [negatedPositiveEvidencePattern(categoryEvidenceTargets["observability-and-logging"])],
  "cost-and-latency": [costNegativePattern, negatedPositiveEvidencePattern(categoryEvidenceTargets["cost-and-latency"])]
};

export function buildMockAuditResponse(request) {
  const { flowBrief, optionalFlowExport, detectedSignals } = request;
  if (!detectedSignals.hasEnoughContext) {
    return buildNotEnoughContextResponse(detectedSignals);
  }

  const text = normalizeText(`${flowBrief}\n${optionalFlowExport}`);
  const findings = [];

  addNegativeEvidenceFinding(findings, text, evalNegativePattern, {
    category: "evals-and-tests",
    severity: "high",
    title: "Launch eval coverage is missing",
    evidence: "The brief says evals, tests, fixtures, or assertions are absent.",
    whyItMatters: "Without launch evals, regressions are hard to catch before a customer sees them.",
    recommendedFix: "Add representative success, edge-case, and malformed-input evals before launch."
  });

  addNegativeEvidenceFinding(findings, text, setupNegativePattern, {
    category: "env-and-setup-docs",
    severity: "medium",
    title: "Setup documentation is missing",
    evidence: "The brief says setup or environment documentation is absent.",
    whyItMatters: "Missing setup notes slow review, reproduction, and handoff to customer operators.",
    recommendedFix: "Add required env vars, placeholder examples, and a short local run path."
  });

  addNegativeEvidenceFinding(
    findings,
    text,
    failureNegativePattern,
    {
      category: "failure-paths",
      severity: "high",
      title: "Failure behavior is explicitly missing",
      evidence: "The brief says error or failure behavior is absent or still undecided.",
      whyItMatters: "Operators need predictable behavior when tools or webhooks fail during launch week.",
      recommendedFix: "Document timeout, retry, fallback, and operator escalation behavior."
    }
  );

  addNegativeEvidenceFinding(
    findings,
    text,
    toolNegativePattern,
    {
      category: "tool-boundaries",
      severity: "high",
      title: "Tool and API boundaries are explicitly missing",
      evidence: "The brief says external tools, APIs, webhooks, integrations, or boundary documentation are absent.",
      whyItMatters: "Launch review needs to know where the Flow crosses system boundaries and what each dependency can do.",
      recommendedFix: "Document each tool or API boundary, including permissions, credentials, and read/write behavior."
    }
  );

  addNegativeEvidenceFinding(
    findings,
    text,
    costNegativePattern,
    {
      category: "cost-and-latency",
      severity: "medium",
      title: "Cost or latency guardrails are missing",
      evidence: "The brief says cost, latency, caching, batching, or throughput guardrails are absent.",
      whyItMatters: "Launch reviews need clear performance or spend guardrails when the submitted Flow includes cost or latency evidence.",
      recommendedFix: "Document expected latency, volume, caching, batching, or token-budget limits before launch."
    }
  );

  addNegativeEvidenceFinding(
    findings,
    text,
    securityNegativePattern,
    {
      category: "security-and-privacy",
      severity: "high",
      title: "Security and privacy controls are explicitly missing",
      evidence: "The brief says privacy, security, auth, credential, encryption, permission, or redaction controls are absent.",
      whyItMatters: "Missing security and privacy controls can block customer-facing launch even when the Flow shape is otherwise clear.",
      recommendedFix: "Document auth, secret storage, redaction, permissions, and private-data handling before launch."
    }
  );

  addMissingCategoryFinding(findings, detectedSignals, "tool-boundaries", text, {
    severity: "high",
    title: "Tool and API boundaries are not visible",
    evidence: "The brief does not identify external tools, APIs, webhooks, credentials, or integration boundaries.",
    whyItMatters: "Launch review needs to know where the Flow crosses system boundaries and what each dependency can do.",
    recommendedFix: "Document each tool or API boundary, including permissions, credentials, and read/write behavior."
  });

  addMissingCategoryFinding(findings, detectedSignals, "evals-and-tests", text, {
    severity: "high",
    title: "Launch eval coverage is not visible",
    evidence: "The brief does not name evals, fixtures, assertions, or sample tests for the main path.",
    whyItMatters: "A Flow can appear useful in Studio while still regressing on common customer inputs.",
    recommendedFix: "Add 3-5 representative eval cases with expected structured outputs."
  });

  addMissingCategoryFinding(findings, detectedSignals, "failure-paths", text, {
    severity: "high",
    title: "Failure behavior is not defined",
    evidence: "The brief does not describe retry, timeout, fallback, or error handling behavior.",
    whyItMatters: "Operators need predictable behavior when tools or webhooks fail during launch week.",
    recommendedFix: "Document timeout, retry, and fallback behavior for each external dependency."
  });

  addMissingCategoryFinding(findings, detectedSignals, "env-and-setup-docs", text, {
    severity: "medium",
    title: "Setup documentation is unclear",
    evidence: "The brief does not mention README, setup, config, or .env.example guidance.",
    whyItMatters: "Missing setup notes slow review, reproduction, and handoff to customer operators.",
    recommendedFix: "Add required env vars, placeholder examples, and a short local run path."
  });

  addMissingCategoryFinding(findings, detectedSignals, "observability-and-logging", text, {
    severity: "medium",
    title: "Launch logging is not specified",
    evidence: "The brief does not state what run metadata, logs, traces, or metrics are captured.",
    whyItMatters: "First-week issues are harder to debug without safe, intentional run telemetry.",
    recommendedFix: "Log run ID, decision, confidence, tool success/failure, and safe correlation IDs."
  });

  if (matchesAny(text, [
    /\btoken is pasted\b/,
    /\bsecret is pasted\b/,
    /\b(api[\s-]+key|token|secret|credential|password)\s+(is\s+)?(hardcoded|hard-coded|embedded|pasted|checked in|committed)\b/,
    /\bhardcoded[\s-]+(api[\s-]+key|token|secret|credential|password)\b/,
    /\blogs full\b/,
    /\blog everything\b/,
    /\blogs everything\b/,
    /\blog all\b/
  ])) {
    findings.push({
      category: "security-and-privacy",
      severity: "critical",
      title: "Secret or private data handling is unsafe",
      evidence: "The brief indicates token/secret material or full sensitive content may be pasted or logged.",
      whyItMatters: "Credential or private-data exposure is a launch blocker for customer-facing flows.",
      recommendedFix: "Move secrets to environment variables and redact sensitive payload fields from logs."
    });
  }

  addMissingCategoryFinding(findings, detectedSignals, "security-and-privacy", text, {
    severity: "medium",
    title: "Security and privacy posture is not visible",
    evidence: "The brief does not mention privacy controls, auth, token handling, encryption, permissions, or redaction.",
    whyItMatters: "Customer-facing Flows need clear handling for credentials, private data, and permission boundaries before launch.",
    recommendedFix: "Document auth, secret storage, redaction, and private-data handling for the launch path."
  });

  if (text.includes("does not explain how to replay") || text.includes("replay a failed webhook")) {
    findings.push({
      category: "env-and-setup-docs",
      severity: "medium",
      title: "Failed webhook replay docs are missing",
      evidence: "The brief says failed webhook payloads must be reproducible, but the README does not explain the replay path.",
      whyItMatters: "First-week support will be slower if operators cannot reproduce failed webhook runs.",
      recommendedFix: "Add a Studio replay section for failed webhook payloads before launch."
    });
  }

  const rankedFindings = findings
    .sort((a, b) => severityScore(b.severity) - severityScore(a.severity))
    .slice(0, 5);

  if (rankedFindings.length === 0) {
    return {
      launchDecision: "ready",
      confidence: "high",
      summary: "The Flow brief shows enough launch evidence for a cautious ready decision.",
      detectedSignals,
      topRisks: [],
      findings: [],
      recommendedFixes: [],
      questionsToContinue: []
    };
  }

  const hasCriticalOrHigh = rankedFindings.some((finding) => ["critical", "high"].includes(finding.severity));
  const criticalOrHighCount = rankedFindings.filter((finding) => ["critical", "high"].includes(finding.severity)).length;
  const hasBroadEvidence = new Set(rankedFindings.map((finding) => finding.category)).size >= 2;
  const hasExplicitNegativeEvidence = rankedFindings.some((finding) =>
    finding.title.includes("explicitly") || finding.evidence.includes("says")
  );
  const launchDecision = rankedFindings.some((finding) => finding.severity === "critical")
    ? "not-ready"
    : "needs-review";

  return {
    launchDecision,
    confidence:
      launchDecision === "not-ready" ||
      (hasCriticalOrHigh && (hasBroadEvidence || hasExplicitNegativeEvidence || criticalOrHighCount >= 2))
        ? "high"
        : "medium",
    summary:
      launchDecision === "not-ready"
        ? "Concrete launch blockers remain and should be fixed before this Flow goes live."
        : "The Flow is close to launch, but the top readiness gaps should be fixed or documented first.",
    detectedSignals,
    topRisks: rankedFindings.slice(0, 3).map((finding) => finding.title),
    findings: rankedFindings,
    recommendedFixes: rankedFindings.slice(0, 5).map((finding, index) => ({
      priority: index + 1,
      fix: toRecommendedFixText(finding.recommendedFix),
      estimatedEffort: finding.severity === "critical" ? "medium" : "small",
      launchImpact: ["critical", "high"].includes(finding.severity) ? "high" : "medium"
    })),
    questionsToContinue: []
  };
}

function addMissingCategoryFinding(findings, detectedSignals, category, text, finding) {
  if (findings.some((existing) => existing.category === category)) {
    return;
  }
  const signals = detectedSignals.categorySignals[category] || [];
  if (hasPositiveCategoryEvidence(text, category, signals)) {
    return;
  }
  addFindingOnce(findings, { category, ...finding, title: finding.title || `Missing ${categoryLabels[category]} evidence` });
}

function hasPositiveCategoryEvidence(text, category, signals) {
  if (signals.length === 0) {
    return false;
  }
  return splitEvidenceClauses(text).some(
    (clause) =>
      matchesAny(clause, positiveEvidenceByCategory[category] || []) &&
      !matchesAny(clause, negativeEvidenceByCategory[category] || [])
  );
}

function negativeEvidencePattern(targetPattern) {
  return new RegExp(
    `\\b((no|missing|without)\\s+${targetPattern}|there\\s+(is|are)\\s+no\\s+${targetPattern}|(lacks?|does not include|doesn't include|do not include|don't include|absent)\\s+${targetPattern}|${targetPattern}\\s+(is|are)\\s+(absent|missing|not documented|not defined))\\b`
  );
}

function positiveEvidencePattern(targetPattern) {
  const positiveVerbPattern =
    "(includes?|documents?|defines?|enables?|captures?|configures?|covers?|tests?|implements?|lists?|uses?|calls?|logs?|redacts?|stores?|keeps?)";
  const positiveStatePattern =
    "((is|are)\\s+)?(present|documented|defined|enabled|available|captured|configured|covered|tested|implemented|listed|used|logged|redacted|stored|kept)";
  return new RegExp(
    `\\b(${targetPattern})\\b[^.!?\\n]{0,120}\\b(${positiveVerbPattern}|${positiveStatePattern})\\b|\\b(${positiveVerbPattern}|${positiveStatePattern})\\b[^.!?\\n]{0,120}\\b(${targetPattern})\\b`
  );
}

function negatedPositiveEvidencePattern(targetPattern) {
  const evidenceActionPattern =
    "(present|documented|defined|enabled|available|captured|configured|covered|tested|implemented|listed|used|called|logged|redacted|stored|kept|includes?|documents?|defines?|enables?|captures?|configures?|covers?|tests?|implements?|lists?|uses?|calls?|logs?|redacts?|stores?|keeps?)";
  const negationPattern = "(no|not|never|without|don't|doesn't|do not|does not)";
  return new RegExp(
    `\\b(${targetPattern})\\b[^.!?\\n]{0,60}\\b((is|are|was|were)\\s+)?${negationPattern}\\s+${evidenceActionPattern}\\b|\\b${negationPattern}\\s+${evidenceActionPattern}\\b[^.!?\\n]{0,60}\\b(${targetPattern})\\b`
  );
}

function splitEvidenceClauses(text) {
  return text
    .split(/(?:[.!?;\n]+|\b(?:but|however|although|yet)\b)/)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function addNegativeEvidenceFinding(findings, text, pattern, finding) {
  if (!pattern.test(text)) {
    return;
  }
  addFindingOnce(findings, finding);
}

function addFindingOnce(findings, finding) {
  if (
    findings.some(
      (existing) => existing.category === finding.category && existing.title === finding.title
    )
  ) {
    return;
  }
  findings.push({
    ...finding,
  });
}

function severityScore(severity) {
  return {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1
  }[severity];
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function toRecommendedFixText(value) {
  const codePoints = Array.from(value);
  if (codePoints.length <= recommendedFixMaxLength) {
    return value;
  }
  return `${codePoints.slice(0, recommendedFixMaxLength - 3).join("")}...`;
}

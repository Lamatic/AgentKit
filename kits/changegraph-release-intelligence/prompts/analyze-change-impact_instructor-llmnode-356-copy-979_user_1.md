Analyze ONLY the supplied deterministic comparison between the baseline
and candidate AI workflows.
FLOW PURPOSE:
{{triggerNode_1.output.flowPurpose}}
BASELINE VERSION:
{{triggerNode_1.output.baselineVersion}}
CANDIDATE VERSION:
{{triggerNode_1.output.candidateVersion}}
RELEASE CONTEXT:
{{triggerNode_1.output.releaseContext}}
DETERMINISTIC CHANGE PACKAGE:
{{triggerNode_1.output.changePackage}}
ANALYSIS PROCEDURE:
1. Parse the deterministic change package as JSON.
2. Create exactly one finding for every entry in its "changes" array.
Do not merge separate changes into one finding.
3. Preserve these values exactly when provided:
- changeId
- category
- component
- before value
- after value
4. For observedFact:
- State only what the package explicitly proves.
- Include the exact before and after values.
- Do not use vague descriptions such as "workflow changed."
5. For possibleImpact:
- Explain a possible behavioral consequence.
- Clearly qualify it as a possibility, not a guaranteed result.
- Do not claim measured improvements or regressions without runtime evidence.
6. For evidence:
- Include at least one evidence entry per finding.
- Evidence must closely paraphrase exact data from the change package.
- Do not return an empty evidence array when before/after data exists.
7. For affectedComponents:
- Use the supplied component.
- Also include downstream components only when they appear in affectedPaths.
- Do not invent components.
8. Severity rubric:
- critical: plausible security breach, destructive data impact, complete
workflow failure, or unsafe permission expansion
- high: breaking schema change, fallback removal, safety-rule removal,
tool-permission expansion, or likely downstream contract failure
- medium: meaningful behavioral change requiring targeted regression tests
- low: minor wording, metadata, or non-behavioral change
9. overallImpactLevel must generally reflect the highest finding severity.
Raise it only when multiple changes interact and create additional risk.
10. requiresHumanReview must be true when:
- any finding is high or critical
- the release context is staging-to-production and meaningful uncertainty exists
- tools, permissions, schemas, safety instructions, or fallback paths changed
11. When the "changes" array is empty:
- overallImpactLevel must be "low"
- requiresHumanReview must be false
- findings must be []
- do not invent risks or affected components
12. Allowed category values are exactly:
prompt, model, schema, tool, permission, node, edge, fallback,
retry, branching, environment, other
13. Enum formatting:
- overallImpactLevel must be exactly:
low, medium, high, critical
- severity must be exactly:
low, medium, high, critical
- category values must be lowercase
- never return Moderate, Medium, High, Unknown, or custom categories
14. Do not provide the final deployment decision.
This flow performs semantic impact analysis only.
15. Return only data matching the configured structured output schema.
EVIDENCE AND UNCERTAINTY RULES:
- Evidence must state exact facts from the change package.
- Evidence must not contain speculative words such as may, might, could,
possible, risk, or likely.
- Put all interpretations inside possibleImpact.
- When runtimeEvidence is empty, state this in unknowns.
- When testsExecuted is empty, state this in unknowns.
- Detect cross-cutting risks when multiple changes affect the same path.
- Do not invent runtime measurements, failures, or performance effects.

LOW-RISK CALIBRATION RULES:
- Classify a change as low when it only adjusts wording, tone, clarity,
conciseness, formatting preference, labels, descriptions, or metadata,
and does not alter schemas, tools, permissions, safety requirements,
fallback behavior, execution paths, or external integrations.
- Missing runtime evidence or tests must be reported in unknowns, but their
absence alone must not increase a low-risk change to medium or high.
- requiresHumanReview must be false when:
- every finding has severity low
- the release context is development-to-staging
- no schema, tool, permission, safety, fallback, retry, branching,
environment, or integration change exists
- Use medium only when a change may materially affect business behavior,
output contracts, decision logic, routing, or downstream consumers.
- Preserve punctuation exactly when quoting before and after values.
Do not add extra punctuation.

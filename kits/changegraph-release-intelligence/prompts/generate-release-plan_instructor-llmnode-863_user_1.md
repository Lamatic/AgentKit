Create an evidence-grounded release plan for the following AI workflow change.
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
SEMANTIC IMPACT ANALYSIS:
{{triggerNode_1.output.semanticAnalysis}}
DETERMINISTIC RISK SCORE:
{{triggerNode_1.output.riskScore}}
DETERMINISTIC PROMOTION DECISION:
{{triggerNode_1.output.promotionDecision}}
Generate:
- a concise decision summary
- evidence-backed blockers only when applicable
- targeted regression tests connected to specific change IDs
- a deployment checklist
- a rollback manifest using known baseline values
- concise release notes
- explicit assumptions and unknowns
STRICT REQUIREMENTS:
- Preserve the supplied riskScore exactly as a number.
- Preserve the supplied promotionDecision exactly.
- If promotionDecision is safe_to_promote, blockers must be an empty array.
- If promotionDecision is manual_review_required, do not change it to block_release.
- Do not invent change IDs, components, files, test results, baseline values, or blockers.
- Every targeted test must reference one or more supplied change IDs.
- Return only the configured structured output.
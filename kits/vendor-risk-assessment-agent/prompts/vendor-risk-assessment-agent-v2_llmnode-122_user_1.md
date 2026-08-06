Generate recommendations using the following vendor risk assessment.
Risk Assessment:
{{LLMNode_644.output.generatedResponse}}
Create:
- Executive Summary
- Positive Findings
- Priority Actions
- Recommendations
- Next Steps
Return ONLY valid JSON using this schema:
{
"executive_summary": "",
"positive_findings": [],
"priority_actions": [
{
"priority": "High",
"action": "",
"reason": ""
}
],
"recommendations": [
{
"category": "",
"recommendation": ""
}
],
"next_steps": []
}
Rules:
- Do not reassess risk.
- Do not calculate scores.
- Do not generate new evidence.
- Recommendations must be based only on the supplied assessment.
- Prioritize High-risk findings first.
- Keep recommendations practical and suitable for enterprise vendor risk management.
- Return ONLY valid JSON.
STRICT RULES:
1. Base your response ONLY on the provided context retrieved from the policy vector store.
2. If the policy does not explicitly cover the category or damage type, highlight that manual review is required.
3. Be clear, concise, and extract exact clause numbers or section titles when available.
Analyze the return eligibility for the following claim:
- Product Category: {{triggerNode_1.output.itemCategory}}
- Stated Claim Reason: {{triggerNode_1.output.claimReason}}
- Identified Visual Damage: {{InstructorLLMNode_560.output.damageType}}
- Visual Severity Score: {{InstructorLLMNode_560.output.severityScore}}
- Inspection Summary: {{InstructorLLMNode_560.output.visualNotes}}
Output your summary strictly formatted as a JSON object string with these keys: { "policyFound": boolean, "relevantRules": "string", "policyClauseReference": "string" }
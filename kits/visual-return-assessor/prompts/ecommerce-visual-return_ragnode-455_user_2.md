STRICT RULES:
Base your response ONLY on the provided context retrieved from the policy vector store.
Multiple policy versions may exist within <policy_context>. Base your evaluation EXCLUSIVELY on policy chunks matching the highest `version` value/timestamp provided in the context, and strictly disregard chunks with lower version numbers.
If the policy does not explicitly cover the category or damage type, highlight that manual review is required.
Be clear, concise, and extract exact clause numbers or section titles when available.
Analyze the return eligibility for the following claim:
-Product Category: <product_category>{{triggerNode_1.output.itemCategory}}</product_category>
-Stated Claim Reason: <claim_reason>{{triggerNode_1.output.claimReason}}</claim_reason>
-Identified Visual Damage: <visual_damage>{{InstructorLLMNode_560.output.damageType}}</visual_damage>
-Visual Severity Score: <severity_score>{{InstructorLLMNode_560.output.severityScore}}</severity_score>
-Inspection Summary: <inspection_summary>{{InstructorLLMNode_560.output.visualNotes}}</inspection_summary>
-Retrieved Policy Context:
<policy_context>
{{RAGNode_455.output.context}}
</policy_context>
Output your summary strictly formatted as a JSON object string with these keys: { "policyFound": boolean, "relevantRules": "string", "policyClauseReference": "string" }
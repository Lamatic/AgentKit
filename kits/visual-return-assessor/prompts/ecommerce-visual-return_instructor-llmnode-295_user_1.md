Order Info: {{triggerNode_1.output.orderId}}
Claimed Reason: {{triggerNode_1.output.claimReason}}
Visual Findings: Damage = {{InstructorLLMNode_560.output.damageType}}, Severity = {{InstructorLLMNode_560.output.severityScore}}/ 1.0
Notes: {{InstructorLLMNode_560.output.visualNotes}}
Retrieved Policy Rules (Ref: {{RAGNode_330.output.references}}):
{{RAGNode_330.output.modelResponse}}
Evaluate whether damage severity and policy criteria qualify for auto-approval, require manual human review, or should be rejected.
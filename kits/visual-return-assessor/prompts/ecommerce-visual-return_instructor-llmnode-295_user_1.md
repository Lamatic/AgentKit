Order Info: <order_id>{{triggerNode_1.output.orderId}}</order_id>
Claimed Reason: <claim_reason>{{triggerNode_1.output.claimReason}}</claim_reason>
Visual Findings:

- Damage: <damage_type>{{InstructorLLMNode_560.output.damageType}}</damage_type>
- Severity: <severity_score>{{InstructorLLMNode_560.output.severityScore}}</severity_score> / 1.0
- Visual Notes: <visual_notes>{{InstructorLLMNode_560.output.notes}}</visual_notes>
  Retrieved Policy Rules (Ref:<policy_ref> {{RAGNode_455.output.references}}</policy_ref>):
  <policy_content>{{RAGNode_455.output.modelResponse}}</policy_content>
  Evaluate whether damage severity and policy criteria qualify for auto-approval, require manual human review, or should be rejected.
  If the estimated fraudRiskScore is strictly greater than 0.50, flag the claim for manual inspection and set the decision to MANUAL_REVIEW.

Evaluate this onboarding entity based on all available findings:
1. Document Details:
{{agenticDocExtractionNode_581.output.extractedText}}
2. Branch Analysis Data (Evaluate whichever path was executed):
- Memory History: {{memoryRetrieveNode_264.output.memories}}
- API Verification: {{apiNode_483.output}}
- Policy/Regulatory Match: {{hybridSearchNode_546.output.searchResults}}
Assessment Criteria:
- Examine the extracted vendor details, sign-offs, and compliance checks.
- If severe flags, failed sanctions checks, or missing mandatory sign-offs exist, route to 'HighRiskAgent'.
- If all compliance checks pass and no flags are present, route to 'LowRiskAgent'.
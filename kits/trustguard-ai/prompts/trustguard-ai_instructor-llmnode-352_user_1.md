Investigation:
{{InstructorLLMNode_381.output.investigation}}
Evidence:
{{InstructorLLMNode_849.output.evidence}}
Threat Analysis:
{{InstructorLLMNode_847.output.analysis}}
Return only JSON matching the schema.classification MUST be exactly one of: phishing, scam, malware, spam, credential_theft, business_email_compromise, safe, unknown. Never invent another value.final_verdict MUST be exactly one of - allow, warn, quarantine, block, escalate.priority MUST be exactly one of - Low, Medium, High, Critical.Allowed values ONLY classification phishing scam malware spam credential_theft business_email_compromise safe unknown If no value applies unknown Never invent another value.
Don't invent any other enum. Keep the enum stable.
total example -
- Dangerous Prize Mail- Risky Email- ScamKeep the enum stable.Priority -
- Low- Medium- High- Critical
Human Review
- true- false
For example -
Risk 68Confidence 61human_review = true
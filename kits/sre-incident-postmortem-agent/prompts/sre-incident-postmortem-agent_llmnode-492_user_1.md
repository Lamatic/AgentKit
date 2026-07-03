Create an SRE incident postmortem from the following incident information.
Service Name:
{{triggerNode_1.output.service_name}}
Incident Title:
{{triggerNode_1.output.incident_title}}
Alert Details:
{{triggerNode_1.output.alert_details}}
Logs or Symptoms:
{{triggerNode_1.output.logs_or_symptoms}}
Timeline Notes:
{{triggerNode_1.output.timeline_notes}}
Impact Description:
{{triggerNode_1.output.impact_description}}
Current Status:
{{triggerNode_1.output.current_status}}
Return valid JSON only with exactly these keys:
{
    "severity": "string",
    "executive_summary": "string",
    "suspected_root_cause": "string",
    "timeline": ["string"],
    "customer_impact": "string",
    "immediate_remediation": "string",
    "long_term_prevention": ["string"],
    "owner_followups": ["string"],
    "markdown_postmortem": "string"
}
Rules:
- Do not rename keys.
- Do not use root_cause instead of suspected_root_cause.
- Do not use remediation, immediate_actions, resolution, or immediate_fix instead of immediate_remediation.
- immediate_remediation must be a single string, not an array.
- timeline, long_term_prevention, and owner_followups must be arrays of strings.
- Do not wrap the JSON in markdown.
- Do not include any explanation outside the JSON.
- If information is missing, use "Needs confirmation" inside the appropriate field.
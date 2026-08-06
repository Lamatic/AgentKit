Extract all relevant vendor information from the following text.
Vendor Information:
{{triggerNode_1.output.sampleInput}}
Return ONLY valid JSON using this exact schema:
{
"vendor_name": "",
"certifications": [],
"security_controls": {
"data_encryption_at_rest": "",
"data_encryption_in_transit": "",
"access_controls": "",
"security_monitoring": "",
"incident_response": ""
},
"compliance": {
"gdpr": "",
"hipaa": "",
"soc2": "",
"iso27001": "",
"other": []
},
"financial_information": "",
"operational_information": {
"disaster_recovery": "",
"business_continuity": "",
"service_availability": ""
},
"legal_information": "",
"missing_information": []
}
Rules:
- Do not calculate risk.
- Do not generate recommendations.
- Do not explain your reasoning.
- If a field is unavailable, return "Not Provided".
- Populate missing_information with important missing items required for vendor assessment.
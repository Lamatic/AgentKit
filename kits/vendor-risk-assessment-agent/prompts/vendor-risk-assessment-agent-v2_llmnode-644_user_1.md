Analyze the following structured vendor information.
Vendor Information:
{{LLMNode_538.output.generatedResponse}}
Evaluate the following categories:
- Security Risk
- Compliance Risk
- Financial Risk
- Operational Risk
- Legal Risk
For each category provide:
- risk
- score (1–5)
- reason
- evidence
Calculate the average category score and return it as overall_risk_score.
Determine the overall_risk using the scoring rules defined in the system prompt.
Return ONLY valid JSON using this schema:
{
"overall_risk_score": 0,
"overall_risk": "",
"categories": [
{
"name": "Security Risk",
"risk": "",
"score": 0,
"reason": "",
"evidence": ""
},
{
"name": "Compliance Risk",
"risk": "",
"score": 0,
"reason": "",
"evidence": ""
},
{
"name": "Financial Risk",
"risk": "",
"score": 0,
"reason": "",
"evidence": ""
},
{
"name": "Operational Risk",
"risk": "",
"score": 0,
"reason": "",
"evidence": ""
},
{
"name": "Legal Risk",
"risk": "",
"score": 0,
"reason": "",
"evidence": ""
}
]
}
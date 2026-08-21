You are now synthesizing the disruption intelligence into a final risk matrix.

**Parsed Suppliers:**
{{LLMNode_parse.output.generatedResponse}}

**Disruption Signals Found:**
{{LLMNode_search.output.generatedResponse}}

For each supplier, assign a Disruption Probability Score (0–100) following the scoring guidelines in your constitution. Then build the complete risk matrix.

Return a JSON object with this exact structure:
```json
{
  "risk_matrix": [
    {
      "id": "supplier_1",
      "name": "Supplier Name",
      "location": "City, Country",
      "lat": 0.0,
      "lng": 0.0,
      "components_supplied": "Component description",
      "tier": 1,
      "risk_score": 75,
      "risk_level": "High",
      "risk_factors": ["Labor protests near industrial zone", "Port congestion reported"],
      "recommended_action": "Draft inquiry email and activate monitoring",
      "data_confidence": "high"
    }
  ],
  "summary": "One paragraph executive summary of the overall supply chain risk landscape identified in this scan."
}
```

**risk_level** must be one of: "Critical", "High", "Elevated", "Normal"
**data_confidence** must be one of: "high", "medium", "low"

Output ONLY the JSON object — no markdown fences, no explanation.

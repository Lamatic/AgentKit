Parse the following raw supplier data into a structured JSON array. The input may be in CSV or JSON format.

**Raw Input:**
{{triggerNode_1.output.suppliers}}

**Optional Scan Focus:** {{triggerNode_1.output.scan_focus}}

Return ONLY a valid JSON array with this exact structure for each supplier:
```json
[
  {
    "id": "supplier_1",
    "name": "Supplier Name",
    "location": "City, Country",
    "lat": 0.0,
    "lng": 0.0,
    "components_supplied": "Component description", 
    "tier": 1
  }
]
```

If lat/lng are not provided, estimate them from the location name.
If tier is not provided, default to 1.
Output ONLY the JSON array — no explanation, no markdown fences.

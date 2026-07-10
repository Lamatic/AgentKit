# Flow: Scope Creep Detector

A single Lamatic flow with 3 nodes:
1. **API Request (trigger)** — accepts `scopeText` and `newMessage`
2. **Generate Text (LLM node)** — classifies each ask against `scopeText`
3. **API Response** — returns the model's JSON output

See `config.json` for the exact Lamatic Studio flow export, `inputs.json`
for a sample test payload, and `meta.json` for flow/project IDs and endpoint.

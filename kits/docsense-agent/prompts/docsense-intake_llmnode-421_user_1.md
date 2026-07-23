Task: Given the facts extracted from a new document AND the client's current intake state, decide what NEW requirements this document triggers.
You are given:
- extractedFacts: structured facts from the document just received.
- currentRequirements: the client's live requirement list (id, label, status).
- clientType: "new" or "returning".
- baselineRoutine (returning clients only): requirement ids that are ROUTINE for this client and should NOT be re-surfaced.
Rules:
- Propose a trigger ONLY when a fact genuinely implies a new document/action is needed. Examples:
    * foreign payment -> Form 15CA/CB
    * large cash deposit -> source-of-funds declaration
    * new vendor with GSTIN -> vendor GST verification
    * property sale -> capital gains computation + sale deed
- Each trigger MUST cite the specific fact as its reason (with figures/dates).
- Do NOT re-propose anything already in currentRequirements.
- For RETURNING clients, do NOT propose anything whose id is in baselineRoutine.
- If nothing new is triggered, return an empty triggers array. Silence is correct.
- Return ONLY valid JSON, no prose, no markdown fences.
Return this shape:
{
  "satisfies": [ string ],
  "triggers": [
    { "requirementId": string, "label": string, "reason": string }
  ]
}
extractedFacts: {{extraction.output.generatedResponse}}
currentRequirements: []
clientType: new
baselineRoutine: []
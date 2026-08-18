# Home Maintenance Triage

## What this agent does

Home Maintenance Triage takes a description of a household problem — a leak, a strange smell, a noise from the AC, a discoloration on the wall — and returns a structured, cautious assessment of how serious it is and what the person should do next.

The output is always honest about what the agent can and cannot determine. When evidence is unclear, it defaults to the more cautious interpretation. It never gives repair instructions for anything electrical, gas-related, or structural.

## What it returns

Given an issue description and an optional photo URL, the agent produces:

- **category** — the type of problem: water damage, electrical, structural, mold, pest, cosmetic, or other
- **severity** — low, moderate, high, or emergency
- **urgency** — a single sentence explaining the timeframe for action
- **professionalNeeded** — whether a licensed professional is required
- **professionalType** — which kind, if applicable (plumber, electrician, HVAC technician, structural engineer, etc.)
- **safeNextSteps** — two to five concrete actions the person can take right now
- **doNotDo** — things they should explicitly avoid attempting themselves
- **reasoning** — one or two sentences explaining the assessment
- **disclaimer** — a fixed note that this is informational, not a professional inspection

## What it will not do

- Give confident DIY repair instructions for electrical, gas, or structural problems
- Downplay a potential hazard to seem more helpful or reassuring
- Fabricate details that are not visible in the image or stated in the description
- Act as a substitute for a licensed inspector, electrician, plumber, or structural engineer

For emergencies, safe next steps are hazard-specific:

- **Active gas smell:** (1) Evacuate the area immediately; (2) Contact emergency services or your gas utility provider. Do not touch any switches, appliances, or breakers — any spark can ignite gas.
- **Fire or smoke:** (1) Evacuate immediately; (2) Contact emergency services (fire department).
- **Active sparking or electrical fault:** (1) Evacuate or step back from the area; (2) Contact emergency services; (3) Turn off the breaker for that circuit only if you can safely reach the panel without crossing the hazard; (4) Contact a licensed electrician.

## Example — water damage

**Input:** photo of a brown stain spreading across a ceiling, description: "noticed it a week ago, seems to be growing"

**Output:**
```json
{
  "category": "water damage",
  "severity": "moderate",
  "urgency": "Address within the next few days",
  "professionalNeeded": true,
  "professionalType": "plumber",
  "safeNextSteps": [
    "Check the room or floor above for a leaking pipe or fixture",
    "Place a container under the stain if it is actively dripping",
    "Take photos to track whether the stain grows"
  ],
  "doNotDo": ["Do not cut into the ceiling to inspect it yourself"],
  "reasoning": "A growing stain suggests an active, ongoing leak rather than a one-time incident. The source needs to be found and stopped.",
  "disclaimer": "This is an informational assessment, not a professional inspection. For anything electrical, gas-related, or structural, or if you are unsure, contact a licensed professional."
}
```

## Example — electrical emergency

**Input:** description: "wall outlet is sparking and I can smell something burning"

**Output:**
```json
{
  "category": "electrical",
  "severity": "emergency",
  "urgency": "Stop and act immediately",
  "professionalNeeded": true,
  "professionalType": "licensed electrician",
  "safeNextSteps": [
    "Evacuate or step back from the immediate area if smoke or burning smell is active",
    "Call emergency services immediately",
    "Turn off power to that circuit at the breaker only if you can safely reach the panel without crossing the hazard",
    "Contact a licensed electrician once the immediate hazard is addressed"
  ],
  "doNotDo": [
    "Do not touch the outlet",
    "Do not attempt to inspect or repair this yourself"
  ],
  "reasoning": "Sparking combined with a burning smell indicates an active electrical fault and a fire risk.",
  "disclaimer": "This is an informational assessment, not a professional inspection. For anything electrical, gas-related, or structural, or if you are unsure, contact a licensed professional."
}
```

## How the flow works

The flow has three nodes:

1. **API Request** — trigger node that receives `issueDescription` (required) and `imageUrl` (optional)
2. **Generate Text** — a vision-capable LLM node that analyzes the input using the system prompt in `prompts/home-maintenance-triage_generate-text_system.md`
3. **API Response** — returns the generated JSON string as the `output` field

The system prompt encodes the severity logic, safety escalation rules, and output contract directly. The model is instructed to return only valid JSON with no surrounding text.

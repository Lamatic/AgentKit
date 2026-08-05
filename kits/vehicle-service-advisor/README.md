# Vehicle Service Advisor

A safety-first AgentKit that turns vague vehicle symptoms into a structured pre-inspection report. It helps an owner decide how urgently to act, understand plausible causes, collect useful evidence, and communicate clearly with a qualified technician.

## The problem

Vehicle owners commonly arrive at a workshop with observations such as “it sounds strange,” “a light came on,” or “it smells hot.” That ambiguity can hide urgent safety risks and makes the first service conversation inefficient. Search results often amplify the problem by presenting one symptom as a confirmed failure.

Vehicle Service Advisor creates a careful handoff between the owner's observations and a professional inspection. It does not diagnose or recommend blind part replacement.

## What it produces

- An urgency level: `stop_now`, `urgent`, `soon`, or `monitor`
- Immediate, plain-language safety guidance
- Up to four possible causes with evidence and likelihood
- Targeted clarification questions
- A prioritized inspection plan separating owner-safe and technician-only actions
- A concise mechanic brief that can be copied into a booking or work order
- Explicit uncertainty and diagnostic limitations

## Architecture

```text
Next.js intake form
        │
        ▼
validated server action
        │
        ▼
Lamatic API trigger → safety-first LLM prompt → structured API response
        │
        ▼
validated triage report + mechanic handoff
```

The browser never receives Lamatic credentials. The app validates inputs at the server boundary, calls one deployed Lamatic flow, validates the returned JSON, and maps transport fields into a UI-focused report model.

## Flow input

| Field | Required | Description |
|---|---:|---|
| `make` | Yes | Vehicle manufacturer |
| `model` | Yes | Vehicle model |
| `year` | Yes | Four-digit model year |
| `mileage` | Yes | Odometer reading with unit |
| `fuel_type` | Yes | Petrol, diesel, hybrid, electric, or other |
| `symptoms` | Yes | Noises, smells, vibration, leaks, timing, and recent changes |
| `warning_lights` | No | Warning names, colors, and timing |
| `recent_service` | No | Recent maintenance or repair context |
| `drivability` | Yes | `normal`, `limited`, or `immobile` |

## Quick start

1. Import `flows/vehicle-service-advisor.ts` and its referenced resources into Lamatic Studio.
2. Select a text generation model and your own provider credential.
3. Deploy the flow and copy its flow ID.
4. Configure the application:

   ```bash
   cd apps
   cp .env.example .env.local
   ```

5. Set the values in `.env.local`:

   ```dotenv
   VEHICLE_SERVICE_ADVISOR_FLOW_ID=your_deployed_flow_id
   LAMATIC_API_URL=your_lamatic_endpoint
   LAMATIC_PROJECT_ID=your_project_id
   LAMATIC_API_KEY=your_api_key
   ```

6. Install and run:

   ```bash
   npm install
   npm run dev
   ```

Open `http://localhost:3000`. The **Preview sample report** action demonstrates the complete interface without calling Lamatic.

## Example request

```json
{
  "make": "Honda",
  "model": "City",
  "year": "2018",
  "mileage": "74000 km",
  "fuel_type": "petrol",
  "symptoms": "Temperature rises in traffic and there is a sweet smell after parking.",
  "warning_lights": "Temperature warning appeared once.",
  "recent_service": "Coolant topped up two weeks ago.",
  "drivability": "limited"
}
```

## Safety and privacy

- This kit provides symptom triage, not a confirmed diagnosis.
- Imminent hazards are escalated to `stop_now` with towing or emergency guidance.
- Unsafe DIY actions are prohibited by the constitution.
- The form does not request a VIN, registration number, address, or contact information.
- API credentials remain server-side and must never be committed.

## Tradeoffs

- The quality of the report depends on the accuracy and completeness of owner observations.
- Without live diagnostic trouble codes or physical inspection, confidence must remain bounded.
- Recall lookup, parts pricing, booking, and workshop inventory are intentionally outside this focused first version.

## Project structure

```text
vehicle-service-advisor/
├── apps/                 # Runnable Next.js interface
├── constitutions/        # Safety and behavioral guardrails
├── flows/                # Lamatic flow graph
├── model-configs/        # Importable model selection
├── prompts/              # System and user prompts
├── agent.md              # Agent capability contract
└── lamatic.config.ts     # Kit metadata and deployment steps
```

## Author

[Sai Varun](https://github.com/saivarun1410)

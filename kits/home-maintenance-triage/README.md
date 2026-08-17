# Home Maintenance Triage Agent

![Built with Lamatic](https://img.shields.io/badge/Built%20with-Lamatic-5B21B6?style=flat-square)
![agentkit-challenge](https://img.shields.io/badge/challenge-agentkit-F59E0B?style=flat-square)
![Type: Kit](https://img.shields.io/badge/type-kit-0EA5E9?style=flat-square)

> Instantly diagnose any home problem with AI — know if it's an emergency, who to call, and what to do right now.

---

## 1. The Problem

Homeowners encounter unexpected issues constantly — a water stain, a sparking outlet, a strange smell from the furnace. The uncertainty about severity causes two equally bad outcomes: **ignoring something genuinely dangerous** (a slow gas leak, active flooding) or **panicking over something trivial** (a small nail hole, surface condensation).

There's no fast, intelligent, always-available way to answer the three questions every homeowner immediately asks:
1. Is this an emergency?
2. Can I fix it myself?
3. Who do I call?

---

## 2. What This Kit Does

Given a **text description** of a home issue (and an optional photo URL), this agent returns a structured triage report:

| Field | Description |
|-------|-------------|
| **Severity** | `low` / `moderate` / `high` / `emergency` |
| **Urgency** | Plain-language timeframe ("Act immediately" vs "Address within days") |
| **DIY Feasible** | Whether the homeowner can safely handle it themselves |
| **Professional Type** | Exactly which specialist to call (plumber, electrician, HVAC, etc.) |
| **Safe Next Steps** | 2–5 concrete, safe actions to take right now |
| **Do NOT Do** | Explicit list of dangerous self-repair attempts to avoid |
| **Reasoning** | Why the AI assessed it this way |
| **Disclaimer** | Always included — this is informational, not a professional inspection |

### Built-in Safety Rules
- **Automatic emergency escalation** for: sparking wiring, gas smells, active flooding, visible structural failure, smoke
- **Never gives DIY instructions** for electrical, gas, or structural — always routes to a licensed professional
- **Defaults to caution** when the image or description is ambiguous

---

## 3. How It Works

```
User Input (text + optional image URL)
        ↓
API Request (GraphQL trigger)
        ↓
Vision LLM (analyzes image + description with safety-first system prompt)
        ↓
Structured JSON Response
        ↓
Next.js UI renders urgency badge + action cards
```

One flow, one LLM node (vision-capable model), clean JSON output.

---

## 4. Setup

### Prerequisites
- [Lamatic.ai](https://lamatic.ai) account (free tier works)
- A vision-capable LLM model configured in Lamatic Studio (e.g. GPT-4o, Gemini 1.5 Pro, Claude 3.5 Sonnet)
- Node.js 18+ for the frontend

### Step 1 — Set up the Lamatic Flow

1. Log in to [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a new project and a new flow
3. Build the flow with these nodes:
   - **API Request** node (trigger, accepts `imageUrl` and `issueDescription`)
   - **Generate Text** (LLM) node — select a **vision-capable** model, paste the system prompt from `prompts/home-maintenance-triage_generate-text_system.md`
   - **API Response** node — maps `output` to `{{LLMNode.output.generatedResponse}}`
4. Deploy the flow and copy the **Flow ID**

### Step 2 — Configure the Frontend

```bash
cd apps
cp .env.example .env.local
```

Fill in `.env.local`:

```env
LAMATIC_PROJECT_ENDPOINT=https://your-project.lamatic.ai
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_PROJECT_API_KEY=your-api-key
NEXT_PUBLIC_LAMATIC_FLOW_ID=your-flow-id
```

### Step 3 — Run Locally

```bash
cd apps
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4 — Deploy to Vercel (optional)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sage106/AgentKit/tree/main/kits/home-maintenance-triage/apps)

Set the same four environment variables in your Vercel project settings.

---

## 5. Example

**Input:**
```json
{
  "issueDescription": "There's a wall outlet that sparked when I plugged something in and I can smell something burning near it",
  "imageUrl": "https://example.com/outlet-photo.jpg"
}
```

**Output:**
```json
{
  "category": "electrical",
  "severity": "emergency",
  "urgency": "Stop and act immediately",
  "professionalNeeded": true,
  "professionalType": "licensed electrician",
  "safeNextSteps": [
    "Turn off power to that circuit at the breaker if you can safely reach it",
    "Keep everyone away from the outlet",
    "Do not plug anything else into nearby outlets",
    "Call a licensed electrician immediately — do not wait"
  ],
  "doNotDo": [
    "Do not touch the outlet",
    "Do not attempt to open or inspect the outlet yourself",
    "Do not ignore the burning smell"
  ],
  "reasoning": "Sparking combined with a burning smell indicates an active electrical fault and potential fire hazard. This requires immediate professional attention.",
  "disclaimer": "This is an informational assessment, not a professional inspection. For anything electrical, gas-related, or structural, or if you are unsure, contact a licensed professional."
}
```

---

## 6. Disclaimer

This tool provides **informational triage only**. It is not a substitute for a licensed inspector, electrician, plumber, or structural engineer. Always defer to a professional for any electrical, gas, structural, or emergency situation.

---

## 7. Assumptions & Tradeoffs

- **Single flow**: Kept deliberately simple — one flow, one LLM call, clean JSON. No RAG or multi-step pipeline needed for triage.
- **Vision support**: The LLM node must be a vision-capable model. Text-only models will still work for description-only queries but won't analyze images.
- **No image storage**: Image URLs are passed directly to the vision model — no file uploads or storage required.
- **Caution-first defaults**: The system prompt instructs the model to always round up on severity when uncertain, ensuring user safety over false reassurance.

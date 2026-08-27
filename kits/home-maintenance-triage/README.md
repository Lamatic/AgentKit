# Home Maintenance Triage

![Built with Lamatic](https://img.shields.io/badge/Built%20with-Lamatic-5B21B6?style=flat-square)
![Type: Kit](https://img.shields.io/badge/type-kit-0EA5E9?style=flat-square)
![Challenge](https://img.shields.io/badge/challenge-agentkit-F59E0B?style=flat-square)

> Describe any household issue and get a structured AI assessment — how serious it is, whether you need a professional, and what to do right now.

---

## The Problem

When something breaks at home, most people face the same uncertainty. Is this a small thing I can handle myself, or do I need to call someone today? Is it safe to wait a few days, or is this actually an emergency?

Getting this wrong in either direction has real consequences. Ignoring a slow gas leak or a sparking outlet can be dangerous. Panicking over a nail hole or a dripping faucet wastes time and money.

This kit gives homeowners a fast, structured way to understand what they are dealing with.

---

## What It Does

You describe the issue — a water stain, a strange smell, a noise from the AC — and the agent returns a structured report:

| Field | Description |
|-------|-------------|
| `category` | water damage, electrical, structural, mold, pest, cosmetic, or other |
| `severity` | low, moderate, high, or emergency |
| `urgency` | Plain-language timeframe for action |
| `professionalNeeded` | Whether a licensed professional is required |
| `professionalType` | Which type of professional, if applicable |
| `safeNextSteps` | Specific actions to take right now |
| `doNotDo` | Things to avoid attempting yourself |
| `reasoning` | Why the agent assessed it this way |
| `disclaimer` | Always included — this is informational, not an inspection |

### Safety-first design

The agent is built around a few hard rules:

- It always rounds up on severity when the situation is ambiguous
- For fire, smoke, gas, or active sparking wiring, safe next steps follow a strict order: (1) Evacuate or leave immediate area if active danger is present; (2) Contact emergency services; (3) Isolate breaker power only if safely accessible; (4) Contact a licensed electrician.
- It never gives DIY instructions for electrical, gas, or structural problems
- It never claims to replace a licensed inspector or professional

---

## How It Works

```
User describes the issue (text + optional photo URL)
         |
   API Request node (Lamatic trigger)
         |
   Generate Text node (vision LLM)
   — analyzes description and image with a safety-first system prompt
         |
   API Response node
         |
   Next.js frontend renders the structured result
```

One flow, one LLM call, clean JSON output.

---

## Setup

### Prerequisites

- A [Lamatic.ai](https://lamatic.ai) account (free tier works)
- A vision-capable model configured in Lamatic Studio — GPT-4o, Gemini 1.5 Pro, or Claude 3.5 Sonnet work well
- Node.js 18 or later

### Step 1 — Build the Lamatic Flow

1. Log in to [studio.lamatic.ai](https://studio.lamatic.ai)
2. Create a new project and a new flow
3. Add three nodes:
   - **API Request** — trigger node, accepts `issueDescription` (string) and `imageUrl` (string, optional)
   - **Generate Text** — LLM node, select a vision-capable model, paste the system prompt from `prompts/home-maintenance-triage_generate-text_system.md`
   - **API Response** — maps `output` to `{{LLMNode.output.generatedResponse}}`
4. Connect them in order: API Request > Generate Text > API Response
5. Deploy the flow and copy the Flow ID from the details panel

### Step 2 — Configure the App

```bash
cd apps
cp .env.example .env.local
```

Open `.env.local` and fill in your four credentials:

```
LAMATIC_PROJECT_ENDPOINT=https://your-project.lamatic.ai
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_PROJECT_API_KEY=your-api-key
NEXT_PUBLIC_LAMATIC_FLOW_ID=your-flow-id
```

### Step 3 — Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 4 — Deploy (Optional)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/sage106/AgentKit/tree/main/kits/home-maintenance-triage/apps)

Set the same four environment variables in your Vercel project settings.

---

## Example

**Input:**
```json
{
  "issueDescription": "Wall outlet sparked when I plugged something in. I can smell something burning near it.",
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
    "Evacuate or step back from the immediate area if smoke or burning smell is active",
    "Call emergency services or an emergency electrician immediately",
    "Turn off power to that circuit at the breaker only if you can safely reach it",
    "Do not touch or attempt to plug anything into nearby outlets"
  ],
  "doNotDo": [
    "Do not touch the outlet",
    "Do not attempt to inspect or repair this yourself",
    "Do not ignore the burning smell"
  ],
  "reasoning": "Sparking combined with a burning smell indicates an active electrical fault and a fire risk. This needs immediate professional attention.",
  "disclaimer": "This is an informational assessment, not a professional inspection. For anything electrical, gas-related, or structural, or if you are unsure, contact a licensed professional."
}
```

---

## Disclaimer

This tool provides informational triage only. It is not a substitute for a licensed inspector, electrician, plumber, or structural engineer. For any electrical, gas, or structural concern — or if you are unsure — contact a qualified professional.

---

## Notes

- The flow uses a single LLM call. No RAG, no multi-step pipeline. For a triage task like this, keeping it simple is the right call.
- The LLM node must be a vision-capable model. Text-only models will still work when no image is provided but cannot analyze photos.
- Image URLs are passed directly to the vision model. No file storage is needed.
- The system prompt instructs the model to round up on severity when uncertain. This is intentional — false reassurance is more dangerous than over-caution.

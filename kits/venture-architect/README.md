# 🏗 VentureArchitect

## AI Venture Architecture Agent

Turns a raw, one-sentence startup idea into a complete, founder-ready
venture blueprint — business strategy, technical architecture, product
roadmap, market analysis, and investor-ready documentation — returned as
clean, structured JSON.

## The problem

Many entrepreneurs have great ideas but struggle to transform them into
structured startup plans. Turning "I have an idea" into a real positioning
statement, a realistic MVP scope, a defensible revenue model, and a
30-second investor pitch takes hours most founders don't have.

VentureArchitect bridges that gap.

## Features

✔ Startup Blueprint
✔ Market Analysis
✔ Competitor Research
✔ MVP Planning
✔ Tech Stack Recommendation
✔ Database Design
✔ API Suggestions
✔ Folder Structure
✔ Development Roadmap
✔ Cost Estimation
✔ Success Metrics
✔ Risk Assessment
✔ Launch Checklist
✔ Next 30-Day Action Plan
✔ Investor Pitch
✔ Resume Description

## Example

**Input**

```json
{
  "idea": "An AI that reviews rental leases and flags unfair clauses for tenants",
  "industry": "PropTech",
  "audience": "First-time renters in the US",
  "budget": "$1,000 - $5,000",
  "timeline": "3 Months",
  "team_size": "Solo Founder"
}
```

**Output (abbreviated)**

```json
{
  "startup_name": "LeaseGuard",
  "tagline": "Know your lease before you sign it.",
  "executive_summary": "...",
  "problem_statement": "...",
  "solution": "...",
  "target_users": ["..."],
  "competitor_analysis": [{"name": "...", "description": "...", "gap": "..."}],
  "revenue_model": ["..."],
  "mvp_features": ["..."],
  "tech_stack": { "frontend": ["..."], "backend": ["..."] },
  "database_design": "...",
  "api_suggestions": ["..."],
  "folder_structure": ["..."],
  "roadmap": [{"phase": "...", "tasks": "..."}],
  "cost_estimation": { "items": [{"item": "...", "estimate": "..."}], "total_estimate": "..." },
  "success_metrics": [{"metric": "Monthly Active Users", "target": "..."}],
  "risk_assessment": [{"risk": "...", "mitigation": "..."}],
  "launch_checklist": ["Validate the idea", "..."],
  "next_30_day_plan": [{"week": "Week 1", "focus": "..."}],
  "investor_pitch": "...",
  "resume_description": "..."
}
```

## Pipeline

```text
API Request
    ↓
Generate Text (LLM)
    ↓
API Response
```

The trigger node's `advance_schema` documents the six accepted input
fields (`idea`, `industry`, `audience`, `budget`, `timeline`, `team_size`).
The LLM node's system prompt (externalized at
`prompts/venture-architect_VentureArchitectLLM_system.md`) carries the
persona and full output schema; its user prompt interpolates the trigger's
input fields directly. The response node maps the LLM's output back to the
caller as `{"result": "..."}`.

`flows/venture-architect.ts` and `flows/venturearchitect/config.json`
describe this same flow in two forms: the former in the unified format
this repo's structure expects, the latter as the raw graph exported
directly from Studio. Keep both in sync if you change the flow.

## Try it in Lamatic Studio

1. Sign in at [studio.lamatic.ai](https://studio.lamatic.ai)
2. Import `flows/venturearchitect/config.json`, or rebuild the 3-node flow
   (API Request → Generate Text → API Response) manually using
   `flows/venture-architect.ts` as a reference
3. In the **Generate Text** node, select a connected model provider (this
   is left blank in the export — `inputs.json` marks it as a required,
   per-deployment private field)
4. Deploy the flow and test it with the example input above (also stored
   as `testInput` in `flows/venturearchitect/meta.json`)

## Running the companion app

`apps/` contains a minimal Next.js project scaffold.

```bash
cd apps
cp .env.example .env.local   # fill in real values
npm install
npm run dev
```

> This scaffold currently ships only `package.json` and `.env.example` —
> it does not yet include page or server-action code that calls the
> deployed flow. Add `app/`, `actions/`, and `lib/` before treating this
> as a working product; see the contributing guide's Kit structure for
> the expected shape (`apps/actions/orchestrate.ts`,
> `apps/lib/lamatic-client.ts`).

## Files

```text
venture-architect/
├── lamatic.config.ts   # project metadata
├── agent.md             # identity + capability doc
├── README.md            # this file
├── .env.example         # local reference for provider credentials
├── apps/
│   ├── package.json
│   └── .env.example
├── flows/
│   ├── venture-architect.ts   # unified-format flow definition
│   └── venturearchitect/       # raw graph exported from Studio
│       ├── config.json
│       ├── inputs.json
│       ├── meta.json
│       └── README.md
├── model-configs/
│   └── venture-architect_VentureArchitectLLM.ts
├── prompts/
│   └── venture-architect_VentureArchitectLLM_system.md
└── constitutions/
    └── default.md
```

## Not intended for

Legal, financial, or investment advice — this is a founder-ready
first-draft tool, not verified business or market research.

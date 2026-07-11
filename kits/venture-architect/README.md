# 🏗 VentureArchitect

### AI Venture Architecture Agent

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

```
API Request
    ↓
Validate Inputs
    ↓
Build Prompt
    ↓
LLM
    ↓
JSON Parser
    ↓
Output
```

Inputs are validated before the model is ever called; the model's raw
output is parsed and checked for required fields before it reaches the
caller — see `scripts/` for both steps.

## Screenshots

> Add screenshots here once this has been built and tested in Lamatic
> Studio.

- Landing — _screenshot pending_
- Flow — _screenshot pending_
- Generated Result — _screenshot pending_

## Try it in Lamatic Studio

1. Sign in at [studio.lamatic.ai](https://studio.lamatic.ai)
2. Import this flow (or rebuild it using `flows/venture-architect.ts` as a
   reference — see the note at the top of that file)
3. Confirm the `VentureArchitectLLM` node's provider/model in
   `model-configs/venture-architect_VentureArchitectLLM.ts` matches a
   provider connected in your Studio project
4. Deploy the flow and test it with the example input above

## Files

```
venture-architect/
├── lamatic.config.ts   # project metadata
├── agent.md             # identity + capability doc
├── README.md            # this file
├── flows/
│   └── venture-architect.ts
├── prompts/
│   └── venture-architect_VentureArchitectLLM_system.md
├── scripts/
│   ├── venture-architect_ValidateInputs.ts
│   ├── venture-architect_BuildPrompt.ts
│   └── venture-architect_JSONParser.ts
├── model-configs/
│   └── venture-architect_VentureArchitectLLM.ts
└── constitutions/
    └── default.md
```

## Not intended for

Legal, financial, or investment advice — this is a founder-ready
first-draft tool, not verified business or market research.

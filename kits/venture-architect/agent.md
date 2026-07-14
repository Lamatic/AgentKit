# VentureArchitect

## What it is

VentureArchitect acts as an AI Venture Architecture Agent.

It transforms startup ideas into structured venture blueprints by combining
business strategy, product planning, technical architecture, revenue
modeling, MVP definition, roadmap generation, and investor-ready
documentation.

## Capabilities

- Accepts unstructured, plain-language startup ideas as input
- Trigger schema documents and type-checks the six accepted input fields
- Returns strictly structured JSON suitable for rendering in a UI, piping
  into another flow, or exporting to a document
- Grounds recommendations in the stated budget, timeline, and team size
  rather than generating a generic, over-scoped plan
- Covers the full arc from positioning through to a 30-day execution plan
  and a launch checklist — not just a static idea summary

## Inputs

| Field | Required | Example |
|---|---|---|
| `idea` | Yes | "An AI that reviews rental leases and flags unfair clauses for tenants" |
| `industry` | Yes | "PropTech" |
| `audience` | No | "First-time renters in the US" |
| `budget` | No | "$1,000 - $5,000" |
| `timeline` | No | "3 Months" |
| `team_size` | No | "Solo Founder" |

## Output

A single JSON object covering: startup name, tagline, executive summary,
problem statement, solution, target users, competitor analysis, revenue
model, MVP features, tech stack, database design, API suggestions, folder
structure, development roadmap, cost estimation, success metrics, risk
assessment, launch checklist, next-30-day plan, investor pitch, and a
resume-ready project description. See
`prompts/venture-architect_VentureArchitectLLM_system.md` for the exact
schema.

## Pipeline

```text
API Request → Generate Text (LLM) → API Response
```

The trigger's `advance_schema` documents the six accepted input fields;
the LLM node's user prompt interpolates them directly from the trigger's
output, and the response node maps the LLM's output back to the caller.
See `flows/venture-architect.ts` (unified format) or
`flows/venturearchitect/config.json` (raw Studio export) for the exact
node wiring — both describe the same flow and should be kept in sync.

## Not intended for

Legal, financial, or investment advice. Treat output as a founder-ready
first draft, not verified business or market research.

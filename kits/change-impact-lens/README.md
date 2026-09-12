# Change Impact Lens

Analyzes a file's real dependency graph and traces both direct and indirect
impact across a codebase, so you know what to test before you change
something — not just "what imports this file" (any editor already shows
that), but "what could break several layers away, even if it never
imports this file directly."

## Problem

Editors show direct usages ("Find Usages"). They don't show that changing
`utils.ts` could break a page three layers away, because a component you
never look at imports it indirectly. Nothing in AgentKit's existing kits
(Code Review Agent, System Design Analyzer, GitHub Manager) builds an
actual dependency graph or traces multi-hop impact — this kit does.

## How it works

```
File you're changing
      │
      ▼
madge builds a REAL import graph from the codebase (deterministic,
not LLM-guessed — this matters: a wrong dependency claim from an LLM
would be a real footgun for something people use before shipping code)
      │
      ▼
Breadth-first traversal outward from the target file, up to N hops —
finds direct dependents (1 hop) AND indirect ones (2+ hops)
      │
      ▼
That verified evidence — not a guess — is handed to a Lamatic flow
      │
      ▼
An LLM (Groq gpt-oss-120b) explains the impact in plain English,
grouped by hop distance, with a prioritized testing checklist
```

The LLM is only used for the explanation step. The actual "what depends
on what" facts come from real static analysis. This split matters: if the
LLM invented dependency relationships, a developer could trust a wrong
answer right before shipping a change.

## Setup

1. `cd apps`
2. `cp .env.example .env.local` and fill in your real Lamatic credentials
   and flow ID (see Environment Variables below)
3. `npm install`
4. `npm run dev`
5. Open `http://localhost:3000`

## Environment Variables

| Variable | What it is |
|---|---|
| `CHANGE_IMPACT_ANALYSIS_FLOW` | The deployed flow ID for the impact-analysis flow (from Lamatic Studio) |
| `LAMATIC_API_URL` | Your Lamatic project's GraphQL endpoint |
| `LAMATIC_PROJECT_ID` | Your Lamatic project ID |
| `LAMATIC_API_KEY` | Your Lamatic API key |

## Usage

1. Enter a file path relative to the project root (e.g. `lib/utils.ts`)
2. Set how many hops of indirect impact to trace (default 3)
3. Click "Analyze Impact"
4. You'll see:
   - An AI-written explanation of the impact, grouped by hop distance,
     with what to test and why
   - The raw list of affected files, grouped the same way

## What's deliberately NOT included (kept the scope focused, not the biggest possible project)

- Multi-language support — this version analyzes JS/TS/JSX/TSX only
- Circular-dependency detection or risk-scoring heuristics
- Graph visualization — results are a grouped list, not a diagram
- Arbitrary external repo analysis — this kit analyzes its own `apps/`
  folder (a deliberate choice: it works identically whether run locally
  or deployed, since the app's own files are always present wherever
  it's running — an arbitrary external repo would not be)

## Known limitation

Static analysis has real blind spots: dynamically-constructed import
paths, unusual bundler configs, etc. If a kit's `apps/` folder has no
`tsconfig.json`/`jsconfig.json`, this falls back to the standard Next.js
`@/*` → project-root convention rather than requiring the file to exist.
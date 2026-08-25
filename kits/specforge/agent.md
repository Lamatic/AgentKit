# SpecForge

## What it does
SpecForge turns a short feature description into a structured technical spec, then reviews and revises its own output before returning it — a self-correction pattern.

## How the self-correction works
1. **Draft** — writes a first-pass spec from the feature description.
2. **Critique** — scores the draft 0-1 on completeness, clarity, edge-case coverage, and feasibility (structured JSON output), listing specific issues.
3. **Revise** — rewrites the spec, explicitly addressing every issue raised.
4. **Re-critique** — scores the revised spec; both the spec and score are returned.

## Design decision: bounded pass, not an open loop
Lamatic flows are directed acyclic graphs and don't support cyclic back-edges between nodes. Rather than force a workaround, SpecForge implements a deterministic single revision pass — every spec is drafted, critiqued, revised once, and critiqued again. This guarantees every output has been reviewed and improved at least once, with predictable cost (a fixed number of LLM calls per request) and a final quality score the caller can act on.

## Input
`feature_description` (string)

## Output
- `spec` (string) — final, revised technical spec
- `quality_score` (number, 0-1) — critique score after revision

## Nodes
| Node | Type | Purpose |
|---|---|---|
| drafter | LLMNode | Writes the first spec draft |
| critique1 | InstructorLLMNode | Scores the draft, lists issues |
| reviser | LLMNode | Rewrites the spec addressing the issues |
| critique2 | InstructorLLMNode | Scores the revised spec |

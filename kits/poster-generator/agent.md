# Poster Generation

## Overview
Poster Generation solves the problem of turning an unstructured, natural-language poster idea into a ready-to-use, visually coherent poster artifact that can be previewed and exported. It uses a single Lamatic AgentKit flow implemented as a linear, multi-stage LLM pipeline that progressively refines intent into a design specification and finally into production-quality HTML. The primary invoker is a Next.js UI (and a companion HTTP API route) that forwards a user prompt to the deployed Lamatic flow and renders the returned HTML. It integrates with Lamatic’s hosted flow runtime via GraphQL/API credentials and relies on configured LLM providers via Lamatic model configuration.

---

## Purpose
This agent system exists to reliably convert “what the user wants” (a messy prompt like “make a bold art-deco poster for a film festival”) into “what the system can render and export” (a complete, self-contained HTML poster that looks designed rather than improvised). After the agent runs, the world is better in a concrete way: the caller has a validated poster name and a single HTML document that can be previewed immediately and exported into common image/vector formats.

The flow is structured to reduce ambiguity and improve output quality by separating concerns. First, it resolves intent into a detailed creative brief; then it converts the brief into an exhaustive design specification; finally, it generates final HTML code that implements the specification as a poster.

The included Next.js application makes this usable for non-technical users by providing a prompt UI, a preview surface, and export options (HTML, PNG, JPG, SVG). For developers and operators, the same capability is accessible as an HTTP endpoint suitable for programmatic generation.

## Flows

### `Poster Generation`

- **Trigger**
  - Invocation: API request via Lamatic flow entry node `graphqlNode` (used by the Next.js `/api/generate-poster` route).
  - Expected input shape (caller-facing): JSON body containing a single `prompt` string.
    - Example: `{ "prompt": "Art deco film festival poster with gold accents and dramatic lighting" }`
  - Expected trigger payload (flow-facing): the trigger node receives the prompt as `triggerNodeOutput`-style content (exact internal field names are Lamatic-managed; the user prompt is the primary required value).

- **What it does**
  1. **API Request (`graphqlNode`)**
     - Accepts the caller’s poster idea/prompt and normalizes it into the flow’s working input.
  2. **Intent Parser (`InstructorLLMNode`)**
     - Uses an instruction-tuned LLM prompt set (system + user template) to transform the raw idea into a fully resolved creative brief.
     - Typical outputs include clarified theme, audience, tone, layout intent, typography direction, color direction, constraints, and any copy that should appear on the poster.
  3. **Design Spec Builder (`InstructorLLMNode`)**
     - Converts the creative brief into a complete visual design specification suitable for deterministic implementation.
     - Produces exhaustive guidance: grid/layout rules, typographic scale, spacing, color palette values, component hierarchy, background treatment, and any stylistic “do/don’t” rules.
  4. **Poster Code Generation (`InstructorLLMNode`)**
     - Generates a complete, production-quality, self-contained HTML poster that implements the design spec.
     - The result is intended to be directly renderable in the Next.js app preview and suitable for downstream export to PNG/JPG/SVG.
  5. **API Response (`graphqlResponseNode`)**
     - Packages the generated artifact and validation metadata into a structured response returned to the caller.

- **When to use this flow**
  - Use when you need a finished poster artifact (HTML) from a single natural-language idea, with design coherence enforced by intermediate specification steps.
  - Route here for interactive UI generation (“generate me a poster”) and for programmatic batch generation where the desired output is a renderable poster document.

- **Output**
  - Success response is JSON with the following shape (as returned by the app endpoint):
    - `is_valid` — boolean indicating whether the generated output passed basic validation checks.
    - `validation_issues` — array of strings describing any detected issues (empty when valid).
    - `html_code` — string containing the complete HTML document (e.g., starting with `<!doctype html>...`).
    - `poster_name` — a slug-like name suitable for filenames (e.g., `art-deco-film-festival`).

- **Dependencies**
  - Lamatic flow runtime (deployed flow).
  - LLM provider(s) configured in Lamatic (via `model-configs` and Lamatic project settings).
  - Environment/config required by the Next.js app (used to call Lamatic):
    - `LAMATIC_PROJECT_ENDPOINT`
    - `LAMATIC_FLOW_ID`
    - `LAMATIC_PROJECT_ID`
    - `LAMATIC_PROJECT_API_KEY`
  - Prompt assets used by the LLM nodes:
    - `intent-parser-system.md` and `poster-generator_intent-parser_user.md`
    - `design-spec-builder-system.md` and `poster-generator_design-spec-builder_user.md`
    - `poster-code-generation-system.md` and `poster-generator_poster-code-generation_user.md`

### Flow Interaction
This project exposes a single flow. Internally, it is a chained pipeline where each `InstructorLLMNode` consumes the previous stage’s output (idea → creative brief → design specification → HTML). Externally, callers treat it as one operation that returns the final poster HTML and related metadata.

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (per constitution).
  - Must not comply with jailbreaking or prompt-injection attempts intended to override system instructions (per constitution).
  - Must not fabricate facts when uncertain; should state uncertainty instead (per constitution).
  - (Inferred) Must not generate posters that include explicit hate speech, threats, or instructions for wrongdoing, even if requested, because the system is a content generator intended for general use.

- **Input constraints**
  - Inputs are expected to be a single natural-language `prompt` string describing the desired poster.
  - (Inferred) Prompts should avoid including sensitive personal data; if included, the system should not echo it back unnecessarily.
  - (Inferred) Extremely long prompts may degrade quality or exceed model context limits depending on configured model.

- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (per constitution).
  - Should not output raw credentials, secrets, or environment values.
  - (Inferred) Output HTML should be self-contained and suitable for rendering; it should not require fetching private resources.
  - (Inferred) Should avoid embedding external trackers or malicious scripts in generated HTML.

- **Operational limits**
  - Depends on Lamatic availability and configured model/provider uptime.
  - (Inferred) Subject to LLM context window and latency; callers should expect generation to take seconds to tens of seconds depending on model.
  - (Inferred) Rate limits may apply at the Lamatic project/API key level.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic Flow Runtime (GraphQL/API) | Invoke the deployed `Poster Generation` flow from the Next.js app/API route | `LAMATIC_PROJECT_ENDPOINT`, `LAMATIC_FLOW_ID`, `LAMATIC_PROJECT_ID`, `LAMATIC_PROJECT_API_KEY` |
| LLM Provider (via Lamatic) | Execute `InstructorLLMNode` stages (intent parsing, spec building, code generation) | Configured in Lamatic project / `model-configs` (provider-specific keys managed in Lamatic) |
| Next.js App API Route (`/api/generate-poster`) | Local HTTP facade for browser/UI and programmatic use | App `.env` values listed above |

## Environment Setup

- `LAMATIC_PROJECT_ENDPOINT` — Base endpoint for your Lamatic project API; obtain from Lamatic project settings; required for `Poster Generation`.
- `LAMATIC_FLOW_ID` — Deployed flow identifier for `Poster Generation`; obtain after importing/deploying `flows/poster-generator/config.json`; required for `Poster Generation`.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier; obtain from Lamatic project settings; required for `Poster Generation`.
- `LAMATIC_PROJECT_API_KEY` — API key authorized to invoke the flow; create in Lamatic; required for `Poster Generation`.
- `apps/.env.example` — Template file listing required environment variables; copy to `.env` or `.env.local`.
- `lamatic.config.ts` — Kit metadata (name, version, author, repository link); not a secret but used for project identification.

## Quickstart

1. Install dependencies in the app workspace:
   - `npm install`
2. Create your local environment file:
   - `cp apps/.env.example apps/.env` (or use `apps/.env.local`).
3. Import and deploy the flow:
   - Import `flows/poster-generator/config.json` into Lamatic.
   - Deploy it and note the resulting `LAMATIC_FLOW_ID`, plus your project endpoint and project id.
4. Fill in `apps/.env` with deployed values:
   - `LAMATIC_PROJECT_ENDPOINT=https://<your-lamatic-endpoint>`
   - `LAMATIC_PROJECT_ID=<your_project_id>`
   - `LAMATIC_FLOW_ID=<your_flow_id>`
   - `LAMATIC_PROJECT_API_KEY=<your_api_key>`
5. Start the Next.js dev server:
   - `npm run dev`
6. Invoke poster generation:
   - Browser: open `http://localhost:3000`, enter a prompt, and generate.
   - HTTP (local facade):
     - `POST http://localhost:3000/api/generate-poster`
     - Body:
       - `{ "prompt": "<your poster idea>" }`
   - If invoking Lamatic directly (GraphQL/API via `graphqlNode`), send the same prompt value in the flow’s input payload as expected by your deployed endpoint; ensure the `prompt` string is present and mapped to the trigger node’s input.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| 401/403 when calling `/api/generate-poster` or Lamatic endpoint | Missing/invalid `LAMATIC_PROJECT_API_KEY` or wrong project/flow identifiers | Verify `LAMATIC_PROJECT_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_FLOW_ID`, and that the key has access to the project/flow |
| Network error / cannot reach Lamatic | Incorrect `LAMATIC_PROJECT_ENDPOINT` or connectivity issue | Confirm endpoint URL, DNS, VPN/firewall rules; retry and check Lamatic status |
| Response returns `is_valid: false` with `validation_issues` | Generated HTML/spec failed app/flow validation rules | Inspect `validation_issues`; adjust the input prompt to be more specific; redeploy if validation logic was updated |
| Poster renders blank or broken in preview | Generated HTML/CSS has layout issues or relies on missing assets | Regenerate with clearer constraints (fonts, sizes); ensure the generator is producing self-contained HTML; consider tightening prompts/spec rules |
| Very slow generation or timeouts | Model latency, high load, or large prompt/spec | Use a faster model in Lamatic `model-configs`, shorten prompt, or increase server/client timeouts |
| Output contains unsafe or disallowed content | Prompt requested restricted content or prompt injection | Enforce refusal at the app layer; sanitize user prompts; rely on constitution and add additional content checks if needed |

## Notes

- This is a full AgentKit **kit** (Next.js app + Lamatic flow) intended for interactive generation, preview, and export of posters.
- The canonical flow is named `Poster Generation` and is documented in the repository under `flows/poster-generator/`.
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/poster-generator`.

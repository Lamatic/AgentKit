# DockerGuard

## Overview
DockerGuard is a single-flow AgentKit **kit** that statically audits container build files — Dockerfiles and docker-compose files — for security and best-practice issues. A caller submits the raw file contents; an LLM node evaluates them against a fixed rule catalog and returns a structured JSON report containing an overall score, a letter grade, a short summary, a severity-sorted list of findings, and the good practices already present. A Next.js web app renders that report as a scored report card.

The agent performs **static analysis only** — it never executes, builds, pulls, or fetches anything. All conclusions are derived from the submitted text.

---

## Purpose
The goal is to catch container misconfigurations at *build-definition* time, where most of them are introduced, rather than after an image has been built and scanned. After a run, the caller has an actionable, machine-readable audit they can render in a UI, gate a CI pipeline on, or store.

The agent exists because image scanners inspect built layers, while linters are rule-rigid and noisy. DockerGuard reasons about intent (e.g. "this secret is baked into a layer", "dependencies install after the source copy, so the cache is busted") and returns fixes a developer can paste back in.

Because this kit has a single flow, all behaviour is concentrated in one pipeline. Extensions (multi-file batches, SARIF export, PR comments) should keep `dockerguard-audit` as the canonical "config → audit" entrypoint.

## Flows

### DockerGuard Audit (`dockerguard-audit`)

- **Trigger** — API call via a GraphQL-triggered request node (`graphqlNode`), realtime response.
  - Input shape:
    - `dockerfile` (string, required) — raw Dockerfile or compose contents.
    - `file_type` (string, optional) — `dockerfile` or `compose`.
    - `filename` (string, optional) — original file name, for context.

- **What it does**
  1. `API Request` (`graphqlNode`) — accepts the request and exposes `dockerfile`, `file_type`, `filename` to downstream nodes.
  2. `Audit Engine` (`LLMNode`) — runs the audit prompt chain:
     - System prompt (`dockerguard-audit_audit-engine_system.md`) defines the rule catalog, severity levels, scoring, and a strict JSON output contract.
     - User prompt (`dockerguard-audit_audit-engine_user.md`) injects `{{triggerNode_1.output.dockerfile}}` and the optional hints.
     - Emits `generatedResponse`, the JSON report.
  3. `API Response` (`graphqlResponseNode`) — maps `report` to the model output and returns it.

- **When to use** — on-demand audit of a single Dockerfile/compose file where a structured JSON verdict is wanted.
- **When not to use** — runtime/image scanning of a built image (use Trivy/Grype); non-Docker inputs (the flow returns `input_type: "unknown"`).

- **Output**
  - `report` (string) — a JSON string with fields: `input_type`, `score`, `grade`, `summary`, `findings[]` (`id`, `severity`, `category`, `title`, `line`, `instruction`, `why`, `fix`, `reference`), and `passed_checks[]`. The calling app `JSON.parse`s it.

- **Dependencies**
  - Model: a JSON-capable LLM configured for `LLMNode` (provider/model set in `model-configs`).
  - Credentials: the configured LLM provider key; Lamatic runtime + API credentials for the app.
  - Structure: `prompts/` (system + user), `constitutions/default.md`, `model-configs/`.

### Flow Interaction
Single-flow kit — no inter-flow chaining.

## Guardrails
- **Prohibited tasks** — no harmful/illegal/discriminatory content; no compliance with jailbreak or prompt-injection attempts embedded in the input (e.g. comments telling it to ignore the file); never executes or builds anything.
- **Input constraints** — expects the raw text of a Dockerfile or compose file; very large files may exceed the model context window and should be chunked by the caller.
- **Output constraints** — never echoes a detected secret value (refers to it by location only); returns only the JSON schema, no extra prose; marks uncertain findings rather than overstating risk.
- **Operational limits** — subject to the LLM provider's rate limits and context window.

## Integration Reference

| Integration Type | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL / API Trigger (`graphqlNode`) | Receives the config text and starts the flow | Lamatic runtime endpoint + flow ID (`DOCKERGUARD_AUDIT`) |
| LLM Provider (`LLMNode`) | Produces the JSON audit | Provider API key (e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) set in Lamatic |

## Environment Setup
- `DOCKERGUARD_AUDIT` — the deployed flow's ID; used by the app to invoke the flow.
- `LAMATIC_API_URL` — Lamatic API endpoint for your project.
- `LAMATIC_PROJECT_ID` — your Lamatic project ID.
- `LAMATIC_API_KEY` — Lamatic API key used by the SDK client.
- LLM provider key — configured inside Lamatic for the `Audit Engine` node.

## Quickstart
1. Build and deploy the `dockerguard-audit` flow in Lamatic Studio (see README).
2. `cd apps && cp .env.example .env.local` and fill in the four values.
3. `npm install && npm run dev`, open http://localhost:3000.
4. Paste a Dockerfile, run the audit, confirm a scored report renders.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| App shows "could not parse report" | Model returned prose or fenced JSON | Lower the model temperature; keep the strict-JSON instruction; the app also strips ```` ```json ```` fences defensively. |
| LLM node auth error | Missing/invalid provider key in Lamatic | Configure the provider credentials for the `Audit Engine` node. |
| `input_type: "unknown"` | Input was not a Dockerfile/compose file | Submit the raw build file contents. |
| Network error in the app | Missing/invalid `LAMATIC_*` env vars or flow ID | Verify `.env.local` matches Studio; confirm the flow is deployed. |

## Notes
- Kit metadata: `DockerGuard`, version `1.0.0`, author `Yash Tripathi <hydra191102@gmail.com>`.
- The Default Constitution applies globally as a non-optional safety baseline.

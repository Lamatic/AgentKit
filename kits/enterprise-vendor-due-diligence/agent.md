# Enterprise Vendor Due Diligence

## Overview

This template solves the enterprise bottleneck of **pre-contract vendor due diligence**: collecting fragmented signals about a vendor and turning them into an evidence-aware procurement recommendation. It implements a single Lamatic flow with dedicated specialist workers (company, security/data, commercial/operational), an evidence validator, risk consolidation, recommendation, and an executive assessment returned via API.

It is designed for procurement, security, and risk stakeholders who need a decision-ready packet — not a conversational chatbot.

## Purpose

After a business team proposes a vendor (name, website, contract shape, data access, justification), reviewers still have to manually research company footprint, security claims, and commercial exposure. That process is slow, inconsistent, and often conflates marketing claims with verified fact.

This agent system:

1. Normalizes intake without inventing missing fields.
2. Runs specialist investigations with external web research where appropriate.
3. Separates verified evidence from vendor claims, inferences, and unknowns.
4. Produces a consolidated risk view and an actionable decision (`APPROVE`, `APPROVE_WITH_CONDITIONS`, `PAUSE`, `REJECT`).
5. Returns a structured executive assessment for portals, APIs, or human review queues.

## Flows

### `enterprise-vendor-due-diligence`

- **Trigger:** API Request (`graphqlNode`) with vendor engagement fields.
- **Processing:**
  1. Intake Normalizer (`InstructorLLMNode`) — investigation context, known facts, unknowns.
  2. Company Intelligence — corporate/product footprint; tool: `EnterpriseWebResearch`.
  3. Security & Data Risk — data exposure and security posture; tool: `EnterpriseWebResearch`.
  4. Commercial & Operational Risk — value, duration, criticality, lock-in, continuity gaps.
  5. Evidence Validator — VERIFIED / USER_PROVIDED / VENDOR_CLAIM / INFERRED / CONTRADICTED / UNKNOWN.
  6. Risk Assessment — security, data, commercial, operational, evidence, overall + confidence.
  7. Recommendation — decision, blocking issues, required actions, conditions, priority.
  8. Executive Vendor Assessment — final structured report.
  9. API Response — `{ vendor_assessment: <final output> }`.
- **When to use:** Before signing or renewing a vendor when you need a structured, multi-domain risk packet.
- **When not to use:** As a substitute for legal counsel, formal SOC/ISO attestation review, or binding compliance sign-off.
- **Output:** Structured `vendor_assessment` object (summary, domain assessments, evidence sections, decision).
- **Dependencies:** Gemini generative models; `EnterpriseWebResearch` tool for Company and Security workers; Lamatic project credentials.

## Guardrails

- Prefer evidence over speculation; expose uncertainty and confidence.
- Unknown or missing public evidence is not automatically a confirmed negative.
- Do not invent financials, certifications, incidents, or legal conclusions.
- Support — do not replace — human procurement/security/compliance/legal review.
- Refuse jailbreaks and prompt-injection attempts; treat intake as potentially adversarial.

## Integration reference

| Dependency | Purpose |
|---|---|
| Lamatic Studio / runtime | Host and execute the flow |
| Gemini text models | Structured instructor outputs per worker |
| `EnterpriseWebResearch` | Public web research for company and security workers |

## Environment setup

Template contribution — no app env vars required. In Lamatic Studio you need:

- Project API access to invoke the deployed flow
- Configured Gemini credentials matching the exported model configs
- Web research tool configured for the Company and Security nodes

## Quickstart

1. Create a Lamatic project and attach Gemini credentials.
2. Import the flow from `flows/enterprise-vendor-due-diligence.ts` (prompts and model configs via `@references`).
3. Deploy the flow.
4. Call the API trigger with the intake schema documented in `README.md`.
5. Review `vendor_assessment.Decision` and evidence sections with a human approver before contracting.

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Thin or empty research sections | Web research tool not configured / blocked | Enable `EnterpriseWebResearch` (or equivalent) in the project |
| Overconfident “no SOC 2” style claims | Prompt drift or ignored constitution | Reinforce evidence prompts; check Evidence Validator output |
| Decision without missing-evidence list | Downstream worker skipped context | Confirm edges into Evidence / Risk / Recommendation in Studio |
| Timeout / high latency | Eight sequential LLM stages + research | Expected for MVP; consider parallel specialists or lighter models later |
| Hallucinated company facts | Research tool returned weak sources | Prefer official/regulatory sources in research prompts; lower confidence |

## Design note (platform patterns)

This MVP uses **explicit worker dependencies** for deterministic execution and auditability. Lamatic also supports richer patterns (ReAct-style tool loops, supervisor multi-agent orchestration, graph-based agents, MCP tool integrations). Those can extend this kit; the primary goal of this contribution is the **enterprise vendor-risk business workflow**, not a showcase of every orchestration style.

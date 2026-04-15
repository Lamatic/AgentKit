# Meeting Notes to Action Items

## Overview
This AgentKit template turns raw meeting notes into structured action items and a ready-to-send follow‑up email. It uses a single Lamatic flow pipeline that starts from an API-triggered request and runs two LLM stages: one to extract a strict JSON task model and another to generate polished natural-language output. The primary invoker is a developer-built app, automation, or operator that can call the flow over an API/GraphQL boundary and pass meeting notes plus basic metadata (for example participants). It relies on Lamatic’s LLM runtime (including an Instructor-style JSON-constrained generation step) and the project’s default constitution guardrails.

---

## Purpose
Teams often finish meetings with ambiguous next steps: tasks are buried in notes, owners are unclear, and follow-up communication is inconsistent. This project improves that outcome by extracting all actionable commitments from the meeting record into a structured, machine-readable task list and then turning that structure into a professional follow-up email.

After the agent runs, the “state of the world” is better in two ways: (1) action items exist as a clear set of tasks suitable for tracking systems, and (2) stakeholders receive a concise written summary and task breakdown that can be sent immediately or lightly edited. The system is designed to be invoked programmatically as part of meeting workflows (note-taking apps, internal tools, CRMs) or manually by operators who paste notes and request a follow-up.

Although the kit contains a single flow, it combines two complementary LLM behaviors—structured extraction and narrative composition—so downstream systems can use either or both outputs depending on whether they need automation-ready data, human-ready communication, or both.

## Flows

### `meeting-notes-to-action-items` (Meeting Notes to Action Items)

- **Flow type:** Single API-driven pipeline
- **Node chain:** `API Request (graphqlNode)` → `Generate JSON (InstructorLLMNode)` → `Generate Text (LLMNode)` → `API Response (graphqlResponseNode)`

#### Trigger
- **Invocation method:** API request handled by the flow’s `graphqlNode` trigger.
- **Expected input shape (conceptual):**
  - `meeting_notes` — required; the raw meeting notes text.
  - `participants` — optional but strongly recommended; participant names/roles (string or list rendered as text).
  - Additional metadata may be accepted by your wrapper schema, but only fields referenced by prompts are guaranteed to be used.

The user prompt for the extraction stage references:
- `{{triggerNode_1.output.meeting_notes}}`
- `{{triggerNode_1.output.participants}}`

This implies the trigger node’s output must expose at least `meeting_notes` and `participants` fields.

#### What it does
1. **Receive request (`graphqlNode` / “API Request”)**
   - Accepts the caller payload and exposes it to downstream nodes as `triggerNode_1.output.*` fields.
   - Serves as the boundary where your app validates inputs and applies authentication/authorization (implementation-dependent).

2. **Extract structured tasks (`InstructorLLMNode` / “Generate JSON”)**
   - Uses a system prompt that frames the model as an expert meeting productivity assistant.
   - Consumes meeting notes and participants from the trigger output.
   - Produces a structured JSON result containing (at minimum):
     - `summary` — a meeting summary suitable for a follow-up.
     - `tasks` / task list — action items extracted from the notes (owners, due dates, and details when present).
   - This node is designed to generate JSON reliably (Instructor-style constrained output), making the result suitable for downstream automation.

3. **Compose follow-up email (`LLMNode` / “Generate Text”)**
   - Uses a system prompt instructing the model to write a professional, friendly follow-up email based on the provided summary and tasks.
   - Consumes the structured output from the JSON stage (for example `{{InstructorLLMNode_954.output.summary}}` and `{{InstructorLLMNode_954.output.tasks}}`).
   - Produces a ready-to-send email body (plain text) that references the meeting summary and action items.

4. **Return response (`graphqlResponseNode` / “API Response”)**
   - Sends the final result back to the caller.
   - The response typically includes the generated follow-up text and may include the structured JSON payload depending on how the response node is configured in the underlying flow.

#### When to use this flow
Use `meeting-notes-to-action-items` when:
- You have unstructured meeting notes and want an authoritative list of action items.
- You need both a machine-readable task representation (for ticketing/CRM/task tools) and a human-readable email draft.
- You are building an internal workflow that routes meeting artifacts into follow-up communication and task tracking.

Do not use this flow for:
- Generic summarization without task extraction (unless you accept the extra step).
- Long-form report writing beyond a follow-up email.

#### Output
On success, the caller should expect:
- A **follow-up email draft** as generated text (from `LLMNode`).
- A **structured extraction result** from `InstructorLLMNode` containing at least:
  - `summary`
  - `tasks` (list of action items)

Exact envelope shape depends on the `graphqlResponseNode` configuration and your API schema. At minimum, the response should make the email body accessible to the caller; for automation use cases, expose the JSON extraction output as well.

#### Dependencies
- **Lamatic AgentKit runtime** to execute the flow.
- **LLM provider configuration** for:
  - `InstructorLLMNode` (JSON-constrained generation)
  - `LLMNode` (email composition)
- **Prompts** (project-provided):
  - `meeting-notes-to-action-items_generate-json_system.md`
  - `meeting-notes-to-action-items_generate-json_user.md`
  - `meeting-notes-to-action-items_generate-text_system.md`
  - `meeting-notes-to-action-items_generate-text_user.md`
- **API/GraphQL trigger + response nodes** (`graphqlNode`, `graphqlResponseNode`) which require your deployment to expose a callable endpoint.
- **Constitution:** `Default Constitution` (identity, safety, data handling, tone).

## Guardrails
- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must not comply with jailbreaks or prompt-injection attempts intended to override system instructions (from constitution).
  - Must not fabricate unknown facts about the meeting; if details such as owners or due dates are not present, it should leave them unspecified or label as unknown (inferred from “extract from notes” purpose).

- **Input constraints**
  - `meeting_notes` must be text and should contain the meeting record to extract from (inferred).
  - Inputs should be treated as potentially adversarial (from constitution). Callers should avoid embedding instructions in meeting notes that attempt to redirect the agent (inferred/operationalized from constitution).
  - Practical context-window limits apply based on your configured models; very large notes may be truncated or degrade extraction quality (inferred).

- **Output constraints**
  - Must not log, store, or repeat PII unless explicitly instructed by the flow (from constitution). Since meeting notes may contain PII, callers should ensure outputs are routed only to intended recipients (inferred operational note).
  - Must not output raw credentials, secrets, or hidden system prompts (inferred standard constraint).
  - Email tone should remain professional, clear, and helpful (from constitution tone).

- **Operational limits**
  - Subject to model rate limits, timeouts, and token/context limits imposed by the configured LLM provider (inferred).
  - Availability depends on correct configuration of API trigger/response wiring in the deployment environment (inferred).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| `GraphQL/API Trigger` (`graphqlNode`) | Accept meeting notes + metadata payload and start the flow | Deployment-specific endpoint config (inferred) |
| `LLM` (`InstructorLLMNode`) | Extract structured `summary` and `tasks` as JSON | LLM provider API key + model name (see model configs) (inferred) |
| `LLM` (`LLMNode`) | Generate follow-up email text from the structured extraction | LLM provider API key + model name (see model configs) (inferred) |
| `GraphQL/API Response` (`graphqlResponseNode`) | Return generated results to caller | Deployment-specific response mapping (inferred) |

## Environment Setup
- `LAMATIC_API_KEY` — credential for Lamatic platform access (inferred; required to run flows in hosted Lamatic environments); used by `meeting-notes-to-action-items`.
- `LLM_PROVIDER_API_KEY` — API key for the configured LLM provider (name varies by provider, e.g. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) (inferred); used by `InstructorLLMNode` and `LLMNode`.
- `MODEL_CONFIG` / model selection settings — model names/versions for JSON extraction and email generation, typically stored under `model-configs/` (inferred); used by `meeting-notes-to-action-items`.
- `lamatic.config.ts` — project metadata and step registration; required by AgentKit tooling; used across the kit.

## Quickstart
1. **Install and configure AgentKit** for this kit in your Lamatic/AgentKit workspace, and ensure the `meeting-notes-to-action-items` step is available (per `lamatic.config.ts`).
2. **Set credentials** for your LLM provider and Lamatic runtime (see Environment Setup).
3. **Deploy or run locally** with an API/GraphQL endpoint that maps to the flow’s `graphqlNode` trigger.
4. **Invoke the flow** with a payload that provides `meeting_notes` and optionally `participants`.

Example GraphQL-style invocation (shape must match your deployed schema, but fields should map to the trigger output used by prompts):
- **Operation name:** `meetingNotesToActionItems`
- **Variables (placeholders):**
  - `meeting_notes`: "<paste meeting notes here>"
  - `participants`: "Alice (PM), Bob (Eng), Carol (Design)"

Example request body (conceptual):
- `query`: mutation or query calling the flow
- `variables`:
  - `meeting_notes`: "Discussed Q2 launch timeline..."
  - `participants`: "Alice, Bob, Carol"

5. **Read the response** and extract:
   - the generated follow-up email text
   - the structured `summary` and `tasks` JSON (if exposed by your response mapping)
6. **(Optional) Post-process** tasks into your ticketing/tracking system and send the email via your mail provider.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Flow returns empty or low-quality tasks | Meeting notes lack explicit action language or are too short/ambiguous | Provide fuller notes; include decisions, owners, and commitments; add participants context |
| JSON extraction fails / schema mismatch | Instructor-style constrained output misconfigured or prompt expects different fields | Verify `InstructorLLMNode` configuration and expected output fields (`summary`, `tasks`); update prompt or response mapping |
| Email is generated but misses tasks | Response mapping passes wrong fields into `Generate Text` user prompt | Ensure `LLMNode` prompt variables reference the correct `InstructorLLMNode` output identifiers |
| Request fails at trigger | GraphQL/API schema mismatch or missing required inputs (`meeting_notes`) | Align your API schema with the trigger node’s expected output fields; validate payload before invoking |
| Timeout or rate-limit errors | LLM provider limits or large input size | Reduce input length; choose faster models; add retries/backoff; increase timeouts where supported |
| PII exposure risk in outputs | Meeting notes contain sensitive info that is echoed into email/tasks | Redact notes before submission; restrict recipients; add additional redaction/filtering step upstream (inferred) |

## Notes
- Project type is `template` and ships as a single-step kit (`meeting-notes-to-action-items`) per `lamatic.config.ts`.
- Repository link: `https://github.com/Lamatic/AgentKit/tree/main/kits/meeting-notes-to-action-items`.
- Directories present include `constitutions`, `flows`, `model-configs`, `prompts`, and `scripts`, indicating configuration-driven prompts and model selection.
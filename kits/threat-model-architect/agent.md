# Threat Model Architect - Agent Identity

## Overview

Threat Model Architect is a multi-stage security-analysis agent. It converts a plain-English architecture description into a reviewable architecture model, STRIDE threat register, DREAD-ranked risk backlog, and 7/30/60/90-day remediation roadmap.

## Pipeline

1. `intake` captures the initial system context.
2. `decompose-architecture` derives the security-relevant architecture model.
3. `stride-analyze` identifies threats per system boundary and component.
4. `threat-research` adds safe OWASP/CWE context and validation guidance.
5. `dread-prioritize` produces transparent relative-risk scoring.
6. The app derives a deterministic remediation roadmap from the DREAD-ranked threats.

### `intake`

**Trigger:** API Request

**Inputs:**

- `message` - latest user message
- `today` - current date
- `session_state` - accumulated JSON state as a string, usually `{}` on the first request

**Processing:**

The Generate JSON node reads the user message and current state, then:

1. Extracts the user's application architecture into `session_state`
2. Adds mentioned technologies to `components` and `tech_stack`
3. Preserves existing state across turns
4. Asks one clarifying question if required information is missing
5. Sets `is_complete` to `true` only after explicit user confirmation

**Response:**

- `language`
- `assistant_message`
- `is_complete`
- `session_state`
- `missing_info`

## Expected Behavior

For this input:

```json
{
  "message": "We're building a B2B SaaS: Next.js frontend, Node API, Postgres, Stripe, Clerk, files on S3.",
  "today": "2026-07-10",
  "session_state": "{}"
}
```

The flow should extract:

- `system_name`: `B2B SaaS`
- `components`: Next.js frontend, Node API, Postgres database, Clerk auth, Stripe billing, S3 file storage
- `tech_stack`: Next.js, Node.js, PostgreSQL, Stripe, Clerk, AWS S3
- `missing_info`: data sensitivity

It should keep `is_complete` as `false` and ask what sensitive data the application handles.

## Guardrails

The constitution in `constitutions/default.md` is enforced through the system prompt. Important constraints:

- Do not put the agent's own identity into `session_state`
- Do not invent system components the user did not describe
- Do not claim the user's system is secure or compliant
- Do not fabricate CVEs, advisories, or legal/compliance guarantees
- Ask for missing information when architecture context is incomplete

## Integration Notes

The flow is designed to be called via Lamatic's GraphQL API. The app or client passes the returned `session_state` back into the next request until `is_complete` is `true`.

Environment variables used by the app:

| Variable | Purpose |
|---|---|
| `INTAKE_FLOW_ID` | Deployed Lamatic workflow ID for the `intake` flow |
| `DECOMPOSE_FLOW_ID` | Deployed Lamatic workflow ID for architecture decomposition |
| `STRIDE_FLOW_ID` | Deployed Lamatic workflow ID for STRIDE analysis |
| `RESEARCH_FLOW_ID` | Deployed Lamatic workflow ID for threat research |
| `DREAD_FLOW_ID` | Deployed Lamatic workflow ID for DREAD scoring |

## Studio deployment notes

The five active flow exports are tracked under `flows/` and their prompts under `prompts/`. Import each active flow into Lamatic Studio, select a connected capable model, test it, then deploy it and set the matching flow ID in the app environment.

Use `gpt-4o-mini` or Gemini Flash for architecture decomposition and STRIDE generation. The lighter `gpt-4.1-nano` model is prone to returning incomplete architecture arrays for these inference-heavy stages.

### Flow 2: `decompose-architecture`

**Purpose:** Convert `intake.session_state` into a normalized architecture model.

**Trigger:** API Request

**Inputs:**

- `session_state` - JSON string returned by the `intake` flow

**Generate JSON prompts:**

- System: `@prompts/decompose-architecture_system.md`
- User: `@prompts/decompose-architecture_user.md`

**Recommended output schema:**

```json
{
  "system_name": "string",
  "purpose": "string",
  "components": "array",
  "external_actors": "array",
  "data_assets": "array",
  "trust_boundaries": "array",
  "data_flows": "array",
  "entry_points": "array",
  "security_assumptions": "array",
  "missing_info": "array"
}
```

**Expected behavior:** Given a B2B SaaS stack with Next.js, Node API, Postgres, Clerk, Stripe, and S3, the flow should identify browser/user actors, frontend, API, database, auth provider, payment provider, file storage, public-to-app and app-to-data trust boundaries, and inferred data flows.

### Flow 3: `stride-analyze`

**Purpose:** Run STRIDE analysis over the normalized architecture.

**Trigger:** API Request

**Inputs:**

- `architecture` - JSON string returned by `decompose-architecture`

**Generate JSON prompts:**

- System: `@prompts/stride-analyze_system.md`
- User: `@prompts/stride-analyze_user.md`

**Recommended output schema:**

```json
{
  "system_name": "string",
  "summary": "string",
  "threats": "array",
  "coverage": "object",
  "missing_info": "array"
}
```

**Expected behavior:** The flow should generate stack-specific STRIDE threats such as JWT spoofing at the API boundary, tenant ID tampering in file access, Stripe webhook forgery, S3 information disclosure, and API denial-of-service risks, each with concrete mitigations and open questions.

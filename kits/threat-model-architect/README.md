# Threat Model Architect

> Conversational security intake agent that turns a plain-English software-system description into structured architecture context for threat modeling.

## Problem

Threat modeling usually starts with a messy conversation: engineers describe products in prose, security reviewers ask for missing architecture details, and useful context gets lost before analysis begins. Small teams often skip this step entirely because it feels too manual.

## Approach

Threat Model Architect captures the first and most important step of a threat-modeling workflow: security-focused architecture intake. The user describes their application in natural language, and the flow extracts:

- Product purpose and system name
- Components such as frontend, API, database, auth, storage, and third-party services
- Technology stack
- Data assets and sensitivity, when known
- Missing information needed before STRIDE/DREAD analysis

The agent asks one clarifying question at a time and does not proceed until required context is captured.

## Flow

### `intake`

**Trigger:** API Request

**Inputs:**

| Field | Type | Description |
|---|---|---|
| `message` | string | Latest user message describing the system |
| `today` | string | Current date for deterministic context |
| `session_state` | string | JSON string containing the accumulated intake state |

**Output:**

```json
{
  "language": "English",
  "assistant_message": "I captured your stack: Next.js frontend, Node API, Postgres, Stripe billing, Clerk auth, and S3 file storage. What sensitive data does your app handle?",
  "is_complete": false,
  "session_state": {
    "system_name": "B2B SaaS",
    "purpose": "B2B SaaS application",
    "components": [],
    "data_assets": [],
    "trust_boundaries": [],
    "user_roles": [],
    "compliance_notes": [],
    "tech_stack": []
  },
  "missing_info": ["data sensitivity"]
}
```

## Example Test Payload

```json
{
  "message": "We're building a B2B SaaS: Next.js frontend, Node API, Postgres, Stripe, Clerk, files on S3.",
  "today": "2026-07-10",
  "session_state": "{}"
}
```

Expected behavior: the agent extracts the stack into `session_state.components` and `session_state.tech_stack`, keeps `is_complete` as `false`, and asks one question about sensitive data.

## Files

| File | Purpose |
|---|---|
| `lamatic.config.ts` | AgentKit metadata for this template |
| `flows/intake.ts` | Lamatic Studio export for the intake flow |
| `prompts/intake_system.md` | System instructions for architecture intake |
| `prompts/intake_user.md` | User prompt that passes API Request inputs into the model |
| `constitutions/default.md` | Security guardrails and scope boundaries |

## Guardrails

The agent:

- Treats `session_state` as the user's application, not the agent itself
- Never claims the system is secure or compliant
- Does not fabricate CVEs, advisory IDs, or system components
- Asks for missing information rather than guessing
- Keeps security guidance informational and scoped to threat-model preparation

## Future Extensions

This template is designed as the intake stage for a larger security workflow. Natural follow-up flows are:

- `decompose-architecture`
- `stride-analyze`
- `threat-research`
- `dread-prioritize`
- `mitigation-planner`
- `threat-model-chat`

## Author

Kushagra Tiwari

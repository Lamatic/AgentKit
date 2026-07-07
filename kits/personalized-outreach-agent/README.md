# Personalized Outreach Agent

## About This Flow

The **Personalized Outreach Agent** writes tailored job-outreach messages that **never lie about the candidate**.

Most LLM-based outreach tools happily exaggerate — inventing skills, titles, or experience the candidate doesn't actually have, which falls apart in the first interview. This flow fixes that with a **write → verify → rewrite** loop:

1. A **Writer** node drafts a warm, specific outreach message from a company brief and the candidate's real profile.
2. A **Verifier** node then fact-checks *every* claim in that draft against the profile, removes or softens anything unsupported, and returns a transparent **verification report** showing exactly what it kept and what it stripped.

The result is outreach that is both personalized *and* truthful — an anti-hallucination guardrail applied to a real, everyday task.

This flow includes **4 nodes** working together.

## Flow Components

- `graphqlNode` — API Request trigger (inputs: `companyInfo`, `candidateProfile`)
- `LLMNode` — **Writer**: drafts the personalized message
- `LLMNode` — **Verifier**: fact-checks the draft, corrects it, and emits a verification report
- `graphqlResponseNode` — API Response returning the verified message + report

## Inputs

| Field | Type | Description |
|-------|------|-------------|
| `companyInfo` | string | The target company/role context (e.g. a job description or company summary). |
| `candidateProfile` | string | The candidate's **real** background — skills, projects, experience. This is the source of truth the Verifier checks against. |

## Output

A single response containing:

```
VERIFIED MESSAGE:
<the corrected, ready-to-send outreach message>

VERIFICATION REPORT:
- <claim> ✓ Supported
- <claim> ✗ Removed/softened — <reason>
...or "All claims verified against the profile — nothing removed."
```

## Example

**Input**
- `companyInfo`: "Lamatic.ai — a visual-first platform for building and deploying agentic AI apps. Hiring a full-stack / applied-AI intern (remote)."
- `candidateProfile`: "Ganesh, Chennai. Built Outreach Agent (multi-agent write→verify→rewrite loop, Anthropic/Groq), Jobyn (RAG on Supabase + PGVector + Gemini), Credifi (SHAP explainability, FastAPI + React)…"

**Output** — a personalized message referencing only the real projects, plus a report confirming each claim is supported. If the profile had said *"10 years at Google,"* the Verifier would drop it and flag `✗ Removed — not supported by profile.`

## Usage

1. Import this template into your Lamatic workspace.
2. Set the model on both `Generate Text` nodes (any chat model via your provider; tested on OpenRouter GPT).
3. Deploy the flow and call it via the GraphQL API with `companyInfo` and `candidateProfile`.

## Why It's Useful

- **Saves time** — turns a company brief into a ready-to-send, tailored message.
- **Prevents hallucination** — the Verifier guarantees the message only claims what's true.
- **Transparent** — the verification report shows its reasoning, so you can trust the output.

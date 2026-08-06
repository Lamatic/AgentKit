# Personalized Outreach Agent

## Overview

This project solves a narrow but common problem: LLM-generated job outreach tends to **exaggerate the candidate** — inventing skills, tools, titles, or experience that aren't real. Those fabrications are persuasive in a draft but collapse in an interview. This agent produces outreach that is personalized *and* factually grounded, using a **single-flow Lamatic AgentKit template** built around a write → verify → rewrite loop.

The flow accepts an API request containing a company/role brief and the candidate's real profile, drafts a tailored message, then runs a dedicated fact-checking pass that reconciles every claim against the profile before returning a corrected message plus a transparent verification report.

## Purpose

The goal is to let a candidate generate warm, specific outreach at speed without risking dishonest claims. After the agent runs, the caller receives a ready-to-send message in which **every factual statement is backed by the supplied profile**, along with an auditable report of what was verified, softened, or removed.

This mirrors a broader pattern that matters for production agentic apps: **an LLM checking another LLM's output against a source of truth** (an anti-hallucination / groundedness guardrail), applied here to the everyday task of job outreach.

## How It Works

The system is a linear, four-node pipeline:

1. **API Request (`graphqlNode`)** — entry point. Accepts two string inputs, `companyInfo` and `candidateProfile`, via the GraphQL surface.
2. **Writer (`LLMNode`)** — drafts a 120–160 word personalized outreach message. It is instructed to open with a specific hook, highlight only projects/skills present in the profile, and avoid clichés or fabricated claims.
3. **Verifier (`LLMNode`)** — receives the Writer's draft *and* the original profile. It checks every factual claim (skills, tools, projects, titles, years, metrics), keeps supported claims, removes or softens unsupported ones, and outputs a fixed format: a `VERIFIED MESSAGE` block followed by a `VERIFICATION REPORT` block.
4. **API Response (`graphqlResponseNode`)** — returns the Verifier's output to the caller.

Because this is a template with a single primary flow, there is no external orchestration or retrieval stage — the "verification" intelligence lives entirely in the prompt design of the Verifier node and the data handed to it from upstream.

## Data Flow & References

- Trigger inputs are referenced downstream as `{{triggerNode_1.output.companyInfo}}` and `{{triggerNode_1.output.candidateProfile}}`.
- The Verifier reads the Writer's result via `{{LLMNode_119.output.generatedResponse}}`.
- Prompts, model configs, and the constitution are stored in their own directories and referenced with the `@` scheme (`@prompts/...`, `@model-configs/...`, `@constitutions/...`).

## Guardrails

Both LLM nodes operate under the project's `default` constitution (`constitutions/default.md`), which enforces safety, no fabrication when uncertain, and careful handling of user-provided data. The Verifier node adds a task-specific guardrail on top: it is explicitly forbidden from inventing new content and must reconcile the draft strictly against the profile.

## When To Use

- When a job seeker (or a career/recruiting tool) needs personalized outreach that is safe to send without manual fact-checking.
- As a reusable **anti-hallucination pattern**: any place a generated artifact must be reconciled against a trusted source before it leaves the system.

## Integration

Invoke the deployed flow through the Lamatic GraphQL API with a payload of `{ companyInfo, candidateProfile }`. The response contains the verified message and the verification report as a single text output, ready to be surfaced in a UI, an email client, or a downstream automation.

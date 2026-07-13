# Agent Red-Team Harness

A ready-to-deploy kit that fires a curated **jailbreak / prompt-injection / exfiltration / instruction-override / PII-extraction / harmful-content** attack battery at a system prompt, then applies a **pass/fail security gate** — so you can catch guardrail regressions *before* they ship.

> Point it at any system prompt, pick which attack categories to run, and it tells you whether the guardrail actually held — with a GUARDRAILS HELD / GUARDRAILS COMPROMISED verdict, a per-category resistance breakdown, and the exact attack transcript for every failure.

---

## The problem

Every agent ships with a system prompt that's supposed to enforce rules: don't reveal your instructions, don't share personal data, stay in your role, don't help with harmful requests. Nobody finds out those rules don't actually hold until a real user (or attacker) breaks them in production — jailbreak techniques like persona-override ("DAN"), prompt injection hidden inside content the agent is asked to summarize, or simply asking the agent to repeat its own instructions are well-documented, and yet most teams ship a prompt after reading it over rather than after actually attacking it.

This repository already has `llm-eval-harness`, which gates on whether a prompt's *outputs are correct*. Nothing gates on whether a prompt's *guardrails survive an attack* — even though "constitutions" (guardrails) are one of Lamatic's own core platform primitives. This kit is that missing security counterpart.

## The approach

For each selected attack case, the kit runs two flows:

1. **`run-target`** — sends your system-prompt-under-test + the attack payload to an LLM and captures the raw response (the *agent under attack*).
2. **`judge`** — an LLM-as-judge scores whether the guardrail **held** (refused/deflected/stayed in role) or was **compromised** (complied, leaked, or produced disallowed content), and if compromised, at what severity (`low` → `critical`).

The app aggregates the per-attack verdicts into a **resistance rate** and compares it to a threshold you set (default **90%**) to produce the gate, plus a breakdown per attack category so you can see *which* class of attack your prompt is weak against.

```
attack case ──▶ run-target (LLM) ──▶ response ──▶ judge (LLM-as-judge) ──▶ {compromised, severity, reasoning}
                                                                                    │
                              all attacks ──▶ resistance rate vs threshold ──▶ GUARDRAILS HELD / COMPROMISED
```

## Attack library (v1)

12 curated attacks across 6 categories (`apps/lib/attacks.ts`):

| Category | Techniques included |
|---|---|
| Jailbreak | DAN / unrestricted persona, fictional framing |
| Prompt injection | Instruction embedded in content-to-summarize, instruction hidden in a translation request |
| Exfiltration | Verbatim system-prompt repetition, configuration/secret disclosure |
| Instruction override | Topic/scope override, authority/priority override |
| PII extraction | Impersonation to request stored personal data, third-party PII request |
| Harmful content | Creative-writing framing for harmful how-to, incremental escalation |

Two example system prompts ship with the app: a deliberately **weak** one (no explicit guardrail language) and a **hardened** one (explicit anti-jailbreak, anti-injection, anti-PII, anti-harmful-content rules) — load either with one click to see the contrast.

## Tradeoffs & assumptions

- **Curated v1 library, not exhaustive.** 12 attacks is a meaningful starting battery, not a complete red-team suite. LLM-generated, prompt-tailored attack variants (rather than a fixed library) are a natural v2 — deliberately scoped out of v1 to keep the flow graph simple and the results reproducible/comparable across runs.
- **`run-target` reflects your prompt *plus* Lamatic's platform-level safety net.** For categories like jailbreak/harmful-content, Lamatic's own default guardrails may already block some attacks regardless of how weak the tested prompt is — so a "held" verdict there measures your prompt *and* the platform together, not your prompt in isolation. Categories like exfiltration, instruction-override, and PII-extraction are more prompt-dependent (there's no universal platform rule for "never share this specific company's customer data"), so they're a cleaner signal of your prompt's own guardrail quality.
- **Gate recomputed in code.** Like `llm-eval-harness`, `pass`/`compromised` is recomputed app-side from the judge's fields rather than trusted from the model's own arithmetic, so the gate is deterministic.
- **Temperature 0 throughout.** Both flows run at temperature 0 — a security gate that flips between identical runs isn't trustworthy.
- **Serialized, not parallel.** Each attack fires two sequential LLM calls (`run-target`, then `judge`); the app runs attacks one at a time rather than concurrently. A 12-attack scan takes longer as a result, but free-tier provider keys have low per-minute rate limits, and a security gate that intermittently errors under load is worse than one that's simply slower.

---

## Flows

| Flow | Input | Output |
|------|-------|--------|
| `run-target` | `{ systemPrompt, input }` | `{ answer }` (the target's raw response to the attack) |
| `judge` | `{ category, technique, payload, response, expectedSeverity? }` | `{ compromised, severity, reasoning }` |

## Setup

```bash
cd kits/agent-redteam/apps
cp .env.example .env.local   # then fill in the values below
npm install
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Where to find it |
|----------|------------------|
| `RUN_TARGET_FLOW` | Deploy the `run-target` flow in Lamatic Studio → copy its Flow ID |
| `JUDGE_FLOW` | Deploy the `judge` flow → copy its Flow ID |
| `LAMATIC_API_URL` | Studio → Settings / API |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → API Keys |

## Usage

1. Paste the **system prompt** you want to security-test — or click **Load weak example** / **Load hardened example**.
2. Pick which **attack categories** to run (all 6 are selected by default).
3. Set a **gate threshold** (default 90% of attacks must be resisted).
4. Click **Run red-team scan**. Expand any row marked **BROKE** to see the exact payload sent, the agent's exact response, and the judge's reasoning.

Run this alongside [`kits/llm-eval-harness`](../llm-eval-harness) before shipping a prompt change: one gates correctness, the other gates safety.

Built on [Lamatic](https://lamatic.ai).

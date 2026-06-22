# LLM Eval Harness

A ready-to-deploy kit that scores an LLM prompt against a **golden set** using an **LLM-as-judge**, then applies a **CI-style pass/fail gate** — so you can catch quality regressions *before* they ship.

> Point it at any system prompt, give it a handful of test cases with expected criteria, and it tells you whether the prompt's outputs are faithful, relevant, and correct — with a single GATE PASSED / GATE FAILED verdict.

---

## The problem

When you ship an LLM feature and then tweak a prompt or swap a model, output quality can silently regress — a small wording change makes the model hallucinate, over-promise, or drift off-task, and you don't find out until a user does. Eyeballing a few outputs doesn't scale and isn't repeatable.

Teams solve this with an **evaluation harness**: a fixed set of representative inputs (a *golden set*), an automated grader, and a quality bar that must be met to ship. This kit packages that pattern as a hosted, reusable tool on Lamatic.

## The approach

For each case in the golden set, the kit runs two flows:

1. **`run-target`** — sends your system-prompt-under-test + the case input to an LLM and captures the output (the *system under test*).
2. **`judge`** — an LLM-as-judge scores that output against the case's `criteria` (and optional `reference`) on three dimensions, **0–5** each:
   - **Faithfulness** — is every claim grounded? (hallucination is penalised hard — it's a veto)
   - **Relevancy** — does it actually address the input?
   - **Correctness** — does it satisfy the case criteria?

The app aggregates the per-case verdicts into a **pass rate** and compares it to a threshold you set (default **90%**) to produce the gate. A case **passes** only if `overall ≥ 3.5` **and** `faithfulness ≥ 3`.

```
golden case ──▶ run-target (LLM) ──▶ output ──▶ judge (LLM-as-judge) ──▶ {scores, pass, reasoning}
                                                                              │
                              all cases ──▶ pass rate vs threshold ──▶ GATE PASS / FAIL
```

## Results

- Runs entirely on **Lamatic flows** (Groq `llama-3.3-70b-versatile`, temperature 0 for deterministic scoring).
- The judge reliably **distinguishes good from bad output** — e.g. it fails a support reply that invents a refund against a "final-sale is non-refundable" policy (faithfulness 0), and passes a correct, grounded reply.
- Per-case results are expandable to show the generated output and the judge's reasoning, so a failure tells you *why*.

## Tradeoffs & assumptions

- **Single provider (v1):** the flows use Groq. Lamatic stores model credentials at the project level, so multi-provider / bring-your-own-key was deliberately scoped out of v1 — runtime credential injection is a security tradeoff worth doing properly rather than quickly.
- **App-side loop:** the golden set is iterated in the Next.js server action (3 cases concurrently) rather than inside one flow, which keeps the flows simple and lets the UI surface per-case progress and errors.
- **Gate recomputed in code:** `overall` and `pass` are recomputed from the judge's dimension scores in the app, so the gate is deterministic and not dependent on the model's own arithmetic.
- **Defensive parsing:** judge output is tolerant of code fences and minor formatting; run-target output is HTML-entity-decoded before scoring.

---

## Flows

| Flow | Input | Output |
|------|-------|--------|
| `judge` | `{ input, output, criteria, reference? }` | `{ faithfulness, relevancy, correctness, overall, pass, reasoning }` |
| `run-target` | `{ systemPrompt, input }` | `{ answer }` (the generated output under test) |

## Setup

```bash
cd kits/llm-eval-harness/apps
cp .env.example .env.local   # then fill in the values below
npm install
npm run dev                  # http://localhost:3000
```

### Environment variables

| Variable | Where to find it |
|----------|------------------|
| `JUDGE_FLOW` | Deploy the `judge` flow in Lamatic Studio → copy its Flow ID |
| `RUN_TARGET_FLOW` | Deploy the `run-target` flow → copy its Flow ID |
| `LAMATIC_API_URL` | Studio → Settings / API |
| `LAMATIC_PROJECT_ID` | Studio → Project settings |
| `LAMATIC_API_KEY` | Studio → API Keys |

## Usage

1. Paste the **system prompt** you want to evaluate.
2. Provide a **golden set** as JSON — an array of `{ input, criteria, reference? }`.
3. Set a **gate threshold** (default 90%).
4. Click **Run evaluation** — or **Load example** to try a support-agent scenario.

Built on [Lamatic](https://lamatic.ai).

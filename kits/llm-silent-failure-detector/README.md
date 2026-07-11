# LLM Silent Failure Detector

An agent that catches the LLM failures your logs don't tell you about.

## The problem

Standard monitoring — latency, uptime, error rate — is blind to the most expensive class of LLM failures: the ones that don't throw an error. A model that hallucinates a citation, fabricates a statistic, or quietly breaks its output schema still returns a `200 OK` and ships. There's no exception to catch, no alert to fire — the response just looks plausible and gets used.

This kit takes a batch of LLM interaction logs (prompt, context, response) and surfaces the silent failures: which responses weren't actually grounded in their source context, which broke their expected output schema, and — critically — **what patterns those failures fall into**, so an engineer gets a prioritized punch list instead of a wall of individually-flagged rows.

## How it works

This is a multi-step agent, not a single prompt wrapper. For each log in the batch:

1. **Grounding check** (LLM) — verifies every factual claim in the response is actually supported by the provided context. Flags ungrounded claims with a reason, rather than trusting the model to self-report.
2. **Schema check** (deterministic code, not LLM) — if the log declares an `expected_schema`, validates the response against it. This runs as code specifically so it isn't itself a source of the silent-failure problem it's meant to catch.

Flagged logs are then collected and, if there are enough of them (more than 1), run through a second stage:

3. **Embed** each flagged failure (Gemini `text-embedding-004`)
4. **Cluster** by cosine similarity — grouping failures that represent the same underlying problem
5. **Name each cluster** (LLM) — a short label, a description of the pattern, and a suggested engineering fix

The output is a structured report: summary counts, plus a list of named failure modes ranked by frequency.

If 0 or 1 logs are flagged, the pipeline short-circuits straight to a trivial report — there's nothing meaningful to cluster from a single data point, so it skips the embedding/clustering cost entirely rather than running similarity math on nothing.

## Scope: what's in v1, what isn't

Per the challenge brief, the goal was a focused, fully-working submission rather than the largest possible one. What's deliberately **out** of v1, and left as a documented next step rather than a silent gap:

- **Computation/math verification** via a calculator tool — v1 only checks grounding and schema, not arithmetic correctness
- **Cross-model disagreement checking** (re-asking a second model and diffing outputs) — a stronger grounding signal, but adds a second model call per log
- **Real-time/streaming monitoring** — v1 is batch-upload only, not a live pipeline hook
- **Persistent storage of past reports** — the app returns the report to the caller; it doesn't save history

## A real tradeoff worth calling out

Failure clustering here groups by **embedding similarity of the response + failure reason text**. In testing, this worked well when failures shared surface-level content, but it has a real limitation: two failures can share the exact same *underlying pattern* (e.g. "the model fabricated a citation not present in context") while being about completely unrelated topics — one about rainforest statistics, another about a nutrition study. Because content embeddings capture topical/semantic similarity rather than abstract failure-pattern similarity, these end up in separate clusters even though a human reviewer would immediately recognize them as the same class of problem.

The fix would be clustering on a normalized failure-category signal (e.g. having the grounding-check step also emit a coarse failure type, and clustering on that instead of raw response text) rather than on the raw log content. Left as a v2 improvement — the current approach is honest about grouping by content similarity, not pattern similarity, and still produces useful, correctly-labeled clusters even when it under-merges.

## Architecture

```
API Request (logs[]) → for each log:
    Grounding check (LLM) ─┐
    Schema check (code)    ─┤→ merge → flagged?
                                          │
                    ≤1 flagged ──────────┼────────── 2+ flagged
                          │                              │
                  trivial report                  embed each (Gemini)
                          │                              │
                          │                        cluster (cosine sim)
                          │                              │
                          │                        name each cluster (LLM)
                          │                              │
                          └──────────► assemble report ◄─┘
                                          │
                                     API Response
```

## Running it

**Flow**: built and deployed in Lamatic Studio (see `flows/`, `prompts/`, `scripts/`, `model-configs/` for the exported node definitions).

**App** (`apps/`):

```bash
cd apps
npm install
cp .env.example .env.local   # fill in your Lamatic credentials + flow ID
npm run dev
```

Required environment variables (see `apps/.env.example`):
- `LAMATIC_FLOW_ID` — the deployed flow's ID
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — from Lamatic Studio → Settings

Open `localhost:3000`, paste a JSON array of log entries (a sample batch is pre-filled), and run detection.

### Input shape

```json
{
  "logs": [
    {
      "id": "string",
      "prompt": "string",
      "context": "string",
      "response": "string",
      "expected_schema": {}
    }
  ]
}
```

`expected_schema` is optional per log — omit it (or leave it empty) for logs that don't have a structured-output contract to check.

### Output shape

```json
{
  "summary": { "total_logs": 6, "flagged": 4, "clusters": 4 },
  "failure_modes": [
    {
      "name": "Extrinsic Hallucination via Fabricated Citations",
      "count": 1,
      "examples": ["log_hallucination_2"],
      "description": "...",
      "suggested_direction": "..."
    }
  ]
}
```
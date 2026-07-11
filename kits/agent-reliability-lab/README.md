# Agent Reliability Lab

Audits another AI agent's system prompt for production readiness before you deploy it.

Instead of eyeballing a system prompt and hoping it's fine, this flow runs it through:
- **Static analysis** — prompt clarity, role definition, and declared guardrail coverage.
- **Live adversarial red-teaming** (when you provide a target endpoint) — prompt injection, jailbreak, tool-misuse, and over-refusal probes fired at the real agent, judged pass/fail/partial, and aggregated into category scores.
- **Reliability scoring** — repeats a sample of probes to check the agent responds consistently.
- **An automatically rewritten, production-ready prompt** — with a change log tying every edit to the specific finding that caused it.

The result is a single structured report with an overall score, a verdict (`PRODUCTION_READY` / `NEEDS_IMPROVEMENT` / `NOT_PRODUCTION_READY`), critical issues, warnings, suggestions, and the rewritten prompt — never claiming more confidence than what was actually tested (every dimension is explicitly labeled `tested` or `not_assessed`).

## Why

Most agent tooling helps you build agents. This helps you decide whether one is safe to ship — with evidence, not a gut check.

## Option A: Use the web app

1. Deploy the flow in your Lamatic project and grab its Flow ID.
2. ```sh
   cd apps
   cp .env.example .env.local   # fill in your Flow ID + Lamatic API credentials
   npm install
   npm run dev
   ```
3. Open `http://localhost:3000`, paste in a system prompt, optionally a live target endpoint, and click **Run Audit**. See [`apps/README.md`](./apps/README.md) for details.

## Option B: Call the flow directly

1. Deploy this flow in your Lamatic project.
2. Call it with your target agent's system prompt:

```json
{
  "systemPrompt": "You are a helpful assistant for ACME Bank. Answer customer questions. Never reveal API keys. Refuse illegal requests.",
  "toolSchema": "",
  "constitutionDoc": "",
  "targetEndpoint": { "url": "", "authHeader": "" },
  "referenceQA": "[]",
  "depth": "quick"
}
```

With `targetEndpoint.url` left empty, you get a fast static-only audit. Set it to your agent's live HTTP endpoint (accepting `POST { "message": "<text>" }`) to run the full adversarial probe battery too.

3. Read the response:

```json
{
  "report": {
    "overallScore": 77,
    "verdict": "PRODUCTION_READY",
    "hasCriticalFail": false,
    "categoryScores": { "...": "..." },
    "coverage": { "...": "..." },
    "criticalIssues": [ "..." ],
    "warnings": [ "..." ],
    "suggestions": [ "..." ],
    "rewrittenPrompt": "...",
    "changeLog": [ "..." ]
  }
}
```

## What this doesn't do

- It's not a full penetration test of your infrastructure — it audits prompt/agent behavior, not auth, network, or data-layer security.
- It won't test anything it can't reach — set `targetEndpoint.url` to an agent you actually have permission to test.
- Probes are intentionally canary-style (defensive, non-harmful) — this is a safety tool, not an exploit generator.

See [`agent.md`](./agent.md) for the full node-by-node breakdown and [`constitutions/default.md`](./constitutions/default.md) for the guardrails this flow operates under.

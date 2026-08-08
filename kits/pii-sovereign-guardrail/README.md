# PII Sovereign Guardrail

Enterprise middleware that masks personally identifiable information (PII)
before it reaches an external LLM provider (OpenAI, Anthropic, etc.), and
rehydrates it in the response — so raw personal data never leaves your
infrastructure in identifiable form.

## The problem

Enterprise legal and security teams routinely block GenAI rollouts because
raw user input — names, emails, phone numbers, addresses — ends up in a
third-party model vendor's logs. That's a real compliance blocker, not a
hypothetical one, for regulated industries like banking, healthcare-adjacent
SaaS, and legal tech.

## How it works

Two detection layers, because neither alone is honest coverage:

1. **Layer 1 — deterministic (regex).** Catches structurally predictable
   PII: emails, API keys/secrets, phone numbers, credit card numbers. Fast,
   free, and reliable for well-formed matches.
2. **Layer 2 — probabilistic (LLM-based NER).** Catches unstructured PII
   regex can't: names, addresses, free-text personal references. Each
   detection is tagged with a confidence level.

Both layers' detections are masked with indexed placeholders
(`[REDACTED_EMAIL_0]`, `[REDACTED_NAME_1]`, ...) before the prompt is sent
to the target model. After the model responds, the placeholders are swapped
back to their real values — a process that happens entirely within this
flow, never externally.

See [`agent.md`](./agent.md) for the full architecture and an honest list
of what this does and does not cover, and
[`constitutions/default.md`](./constitutions/default.md) for the hard
guardrails the flow must never violate (e.g. fail closed, never persist
the token map).

## Structure
pii-sovereign-guardrail/
├── lamatic.config.ts # kit metadata
├── agent.md # capability doc (read this first)
├── constitutions/default.md # hard guardrails
├── flows/pii-sovereign-guardrail.ts # flow graph — real Lamatic Studio export
├── scripts/ # masking/rehydration logic (real, working)
├── prompts/ # Layer 2 NER prompts
├── model-configs/ # LLM configs per node
└── apps/ # Next.js demo — live masking visualization

This flow is built, deployed, and tested end-to-end in Lamatic Studio.
Everything in `flows/`, `scripts/`, `prompts/`, `model-configs/`, and
`constitutions/` is the real Studio export, not a scaffold — Layer 1
(regex), Layer 2 (LLM NER), the target model call, and rehydration have
all been verified working together on live test runs.

## Running the demo locally

```bash
cd kits/pii-sovereign-guardrail/apps
cp .env.example .env.local     # fill in your own Lamatic + model credentials
npm install
npm run dev
```

The app works out of the box in **demo mode** (Layer 1 only, no LLM call,
no API keys needed) so you can see the redaction pipeline immediately.
Once `.env.local` is filled in with a deployed flow's `LAMATIC_API_KEY`,
`LAMATIC_PROJECT_ID`, `LAMATIC_API_URL`, and `PII_GUARDRAIL_FLOW_ID`, it
automatically switches to the full two-layer pipeline against the real
deployed flow.

## What this does NOT do

- It is not a certified DLP system — for HIPAA/PCI-scope data, pair it with
  dedicated compliance tooling.
- Layer 2 is probabilistic. It significantly improves coverage over regex
  alone but is not a guarantee of catching every unstructured PII mention.
- It does not provide audit logging by itself — pair it with your existing
  observability stack (e.g. Langfuse, which Lamatic already integrates with).

## Tags

`security` `compliance` `pii` `data-sovereignty` `middleware` `enterprise`
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

```
pii-sovereign-guardrail/
├── lamatic.config.ts              # kit metadata
├── agent.md                       # capability doc (read this first)
├── constitutions/default.md       # hard guardrails
├── flows/pii-guardrail.ts         # flow graph (⚠️ see note below)
├── scripts/                       # masking/rehydration logic (real, working)
├── prompts/                       # Layer 2 NER prompts
├── model-configs/                 # LLM configs per node
└── apps/                          # Next.js demo — live masking visualization
```

> ⚠️ **`flows/pii-guardrail.ts` needs one manual step.** The node graph in
> that file is a best-effort scaffold of the documented Lamatic export
> shape, not a byte-for-byte real export. Before deploying: build the node
> sequence described in `agent.md` inside Lamatic Studio's visual editor,
> wire in the `@scripts` / `@prompts` / `@model-configs` files from this
> kit, deploy, then use Studio's **Export** to regenerate this file for
> real. Everything else in this kit (masking logic, prompts, demo app) is
> a complete, working implementation.

## Running the demo locally

```bash
cd kits/pii-sovereign-guardrail/apps
cp .env.example .env.local     # fill in once you've deployed the flow in Studio
npm install
npm run dev
```

The app works out of the box in **demo mode** (Layer 1 only, no LLM call,
no API keys needed) so you can see the redaction pipeline immediately.
Once `PII_GUARDRAIL_FLOW_ID` is set to a real deployed flow, it automatically
switches to the full two-layer pipeline.

## What this does NOT do

- It is not a certified DLP system — for HIPAA/PCI-scope data, pair it with
  dedicated compliance tooling.
- Layer 2 is probabilistic. It significantly improves coverage over regex
  alone but is not a guarantee of catching every unstructured PII mention.
- It does not provide audit logging by itself — pair it with your existing
  observability stack (e.g. Langfuse, which Lamatic already integrates with).

## Tags

`security` `compliance` `pii` `data-sovereignty` `middleware` `enterprise`

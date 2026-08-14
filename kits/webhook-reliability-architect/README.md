# Webhook Reliability Architect

Webhook Reliability Architect turns a webhook delivery contract into a concrete engineering brief: an idempotency key design, bounded retry schedule, dead-letter and replay procedure, observability SLO, failure-mode analysis, and failure-injection test matrix.

It is designed for backend engineers reviewing webhooks that trigger real side effects such as payments, inventory updates, entitlements, or notifications.

## Problem

Webhook failures are deceptive. A receiver can commit the business mutation and still lose the acknowledgement. The sender then retries a request that appears failed even though the side effect already happened. Fixed-interval retries, unbounded queues, and informal replay procedures can multiply the damage.

Teams need a repeatable way to answer:

- What uniquely identifies one business event?
- How is the receipt stored atomically with the side effect?
- Which failures are retryable, and for how long?
- What moves to quarantine instead of retrying forever?
- How can an operator replay safely?
- Which metrics and failure tests prove the design?

## Why this contribution is distinct

The AgentKit registry already includes API review, incident analysis, generic debugging, and data-quality tools. This kit focuses specifically on **delivery semantics and side-effect safety**. It does not review source code or summarize an incident. It converts one webhook scenario into an operational contract that can be tested before production rollout.

## What it produces

- Risk score and concise executive summary
- Idempotency key, payload-hash conflict policy, storage model, and retention window
- Exponential backoff schedule with full jitter and delivery-age budget
- Retryable and non-retryable response classification
- Dead-letter record and operator replay checklist
- Delivery SLO, metrics, alert conditions, and structured log fields
- Failure-mode table and five failure-injection tests
- Staged rollout plan

## Architecture

```text
Next.js form
   │
   ▼
Server Action ── DEMO_MODE=true ──► deterministic local report
   │
   └── live mode ──► Lamatic flow ──► structured reliability report
```

The Next.js application uses Tailwind CSS v4 for styling and React Hook Form with a shared Zod contract for client and server validation. It keeps Lamatic credentials on the server. In live mode it calls the deployed `webhook-reliability-architect` flow through the Lamatic SDK, validates the complete response contract, and renders only supported reports. Demo mode creates a deterministic report from the supplied scenario so reviewers can evaluate the interface without credentials.

## Inputs

The web interface collects the fields below and sends them to Lamatic as one JSON-encoded `scenario` string. Keeping a single flow input makes the contract easy to version while the application continues to validate every field before transmission.

| Field | Purpose |
|---|---|
| System name | Human-readable workflow name |
| Event type | Stable event contract name, such as `payment.succeeded` |
| Business effect | Read-only, reversible write, notification, inventory, or financial |
| Delivery semantics | At-least-once, at-most-once, best effort, or unknown |
| Ordering required | Whether an older event may overwrite newer aggregate state |
| Max attempts / timeout / delivery age | Bounds for the proposed retry plan |
| Existing safeguards | Current signature, retry, deduplication, queue, and logging controls |
| Sample payload | Sanitized example used to identify event-key candidates |
| Failure context | Known incident or design concern |

Do not submit credentials, secrets, personal data, or production payloads.

## Run the app locally

```bash
cd kits/webhook-reliability-architect/apps
npm install
cp .env.example .env.local
npm run dev
```

The example environment enables `DEMO_MODE=true`. Open `http://localhost:3000`, load the included payment-event scenario, and generate a report.

## Connect a deployed Lamatic flow

1. Import or recreate `flows/webhook-reliability-architect.ts` in Lamatic Studio.
2. Select a supported structured-output model and deploy the flow.
3. Set `DEMO_MODE=false` in `apps/.env.local`.
4. Add:

```bash
WEBHOOK_RELIABILITY_ARCHITECT_FLOW_ID=your_deployed_flow_id
LAMATIC_API_URL=https://your-project-endpoint.example.com
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_API_KEY=your_api_key
```

5. Restart the app and verify that the report header says **Live flow**.

## Safety boundaries

- This kit produces architecture guidance; it never changes queues, databases, retry settings, or production traffic.
- It does not guarantee exactly-once delivery. It recommends idempotent processing that contains duplicate delivery.
- A human engineer must validate retention, privacy, capacity, compliance, and transaction-boundary assumptions.
- Dead-letter replay is always operator-controlled and must reuse the original idempotency key.
- Raw secrets and personal data must not be included in prompts, payload examples, logs, or reports.

## Validation

From `apps/`:

```bash
npm run typecheck
npm run build
```

Before contribution, also verify:

- The Lamatic flow imports and runs in Studio.
- The live response matches the structured report contract.
- Demo and live modes render the same report shape.
- Only `kits/webhook-reliability-architect/` is changed in the PR.

## Author

Built by [Amar Kumar](https://github.com/amarkumar00) for the Lamatic AgentKit Challenge.

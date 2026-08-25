# Atlas Agent

Atlas Agent turns a PRD or project document into traceable, approval-gated execution work. It is a full Lamatic AgentKit contribution with four flows and a small Next.js review console.

Author: **Pradeep Nagarajan**
Reference product: [Synapse.ai / Atlas CRM](https://github.com/Pradeeprdncas/Synapse.ai)

## Problem

Generating a list of tasks is not enough. Teams need to prove which requirement created each task, keep AI output behind human approval, assign work using skills and real workload, explain that recommendation, and deliver only relevant execution context.

## Solution

```text
PRD / project document
  → requirement extraction with provenance
  → task proposals linked to requirement IDs
  → human task approval
  → deterministic candidate scoring
  → explainable recommendation and alternatives
  → human assignment approval
  → focused execution context
```

AI interprets documents, drafts proposals, and explains recommendations. Deterministic code owns score calculation. The app owns both approval boundaries. The kit never directly sends email or mutates an external task system.

## Flows

| Flow | Purpose | Main output |
|---|---|---|
| `atlas-extract-requirements` | Extract requirements and source evidence from untrusted project text | `requirements` |
| `atlas-generate-task-proposals` | Draft implementation tasks linked to extracted requirement IDs | `proposals` |
| `atlas-recommend-assignment` | Score candidates deterministically and explain the result | `recommendation` |
| `atlas-deliver-execution-context` | Assemble the approved task and linked context for execution | `executionContext` |

## Human approval model

The Next.js app deliberately pauses after proposals and after assignment scoring. Buttons in the demo represent operator decisions; they are not model tools. Assignment approval stores the filtered task/context in Upstash Redis and returns a five-minute HMAC-SHA256 token containing only the durable approval locator. Before protected delivery, the server verifies the token and atomically consumes the Redis approval with a Lua operation. A token works once; concurrent or subsequent reuse is rejected.

Consumption happens immediately before Lamatic delivery begins. If Lamatic fails after consumption, the approval is not reactivated: retrying requires a new human approval and token.

## Assignment scoring

The referenced script calculates a maximum score of 100:

| Component | Points |
|---|---:|
| Skill match | 40 |
| Role fit | 25 |
| Capacity | 20 |
| Dependency fit | 10 |
| Priority fit | 5 |

Security-sensitive work excludes interns. High complexity favors Team Leads and Senior Developers. The explanation prompt receives the deterministic result and may not alter it.

## Setup

1. Import and deploy all four flows in Lamatic Studio.
2. Copy their deployed IDs into the corresponding environment variables.
3. Run the app:

```bash
cd kits/atlas-agent/apps
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` and paste a small, non-sensitive project document. The included demo text in the UI is synthetic.

## Environment variables

```text
LAMATIC_API_URL
LAMATIC_PROJECT_ID
LAMATIC_API_KEY
ATLAS_EXTRACT_REQUIREMENTS_FLOW_ID
ATLAS_GENERATE_TASK_PROPOSALS_FLOW_ID
ATLAS_RECOMMEND_ASSIGNMENT_FLOW_ID
ATLAS_DELIVER_EXECUTION_CONTEXT_FLOW_ID
ATLAS_APPROVAL_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

Both the kit root and `apps/` contain placeholder-only `.env.example` files.

## Security

- Documents are untrusted and cannot override the constitution.
- Requirements must retain source evidence.
- Model output cannot approve proposals or assignments.
- Execution-context delivery requires a server-verified, short-lived approval token signed with `ATLAS_APPROVAL_SECRET` (minimum 32 characters).
- Approved context is stored durably in Upstash Redis and consumed atomically once before protected execution.
- Assignment scoring uses explicit project metadata only.
- No secrets, uploaded files, databases, or runtime artifacts from Synapse.ai are included.

## Validation

From `kits/atlas-agent/apps`:

```bash
npm install
npm test
npm run lint
npm run build
```

Validate every `@reference` path from the kit root and confirm the PR changes only `kits/atlas-agent/`.

## Known limitations

- Flow definitions must be imported, configured with a model, and deployed in Lamatic Studio before live invocation.
- The browser retains UI state, while approval records are stored durably and consumed once through Upstash Redis. Production deployments still need authenticated authorization around the human approval action.
- The route segment sets a 60-second Next.js `maxDuration` execution boundary. The Lamatic JavaScript SDK currently offers no request-level cancellation, so this runtime limit does not claim to abort the underlying Lamatic network request.
- Execution-context delivery returns a payload; integrating Gmail, Slack, or a task tracker remains the caller's explicit side effect.
- This focused kit omits the full CRM, vector store, OAuth, and persistence layers of the reference product.

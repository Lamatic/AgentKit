# Terraform Plan Gate

## Overview

An agent that reads the JSON form of a Terraform plan and answers the reviewer's question before `apply`: *what in here can hurt us, which of our rules does it break, and what has to be true before we run it?* It scores every resource change, cites the organisation policy it violates, drafts the pull-request comment, and returns a verdict that a human confirms or overrides with a written reason.

## Purpose

Infrastructure changes fail in the expensive direction. A missed `["delete", "create"]` on a database is an outage; a missed `0.0.0.0/0` is a breach. Reviewers know the rules but read plans under time pressure, and the rules live in a wiki nobody opens during review. The gate makes the rules part of the review, every time, without pretending the model should be the one to decide.

## Architecture

```text
plan JSON
   │
   ├─ apps/lib/plan-parse.ts        deterministic: facts, flags, redaction
   │
   └─ flows/tf-plan-review          judgment
         ├─ Vector Search           relevant policies from the tfpolicies store
         ├─ Generate JSON           per-change risk, category, policy ids, mitigation
         ├─ Generate Text           review comment
         └─ Code                    join facts with assessments, counts, verdict
```

The split is deliberate. Whether a change destroys a stateful resource, opens an admin port to the world (AWS security groups, GCP firewalls and Azure network security rules are normalised to one rule shape first), removes deletion protection in the same plan that deletes, or belongs to a plan too large to apply in one go is a question with a right answer, so it is computed and tested. Ranking, policy matching and explanation are the model's job. The verdict is arithmetic on the model's answers, never a model output, so the same counts always give the same gate result.

Each change fact crosses the boundary JSON-encoded, because Studio's trigger schema offers `[]` or `[string]` for arrays and object items are rejected at ingestion. The assemble node parses either shape. The parser skips no-ops and data-source reads, refuses state files, keeps the deposed object of a create-before-destroy replacement apart from its successor (address suffixed with `(deposed <id>)`), and treats a `removed` block (`forget`) as a resource leaving state, not a destroy.

## Flows

### `tf-policy-ingest`

Run once, or whenever the policy set changes.

**Trigger** — API Request:

| Field | Type | Meaning |
|---|---|---|
| `run` | string | Free-text label for the run |
| `policies` | `[string]` | Optional. Your policy set, each entry a JSON-encoded `{ policy_id, title, text, minimum_risk? }`. Empty or absent means the ten defaults |

**Processing** — a Code node parses `policies`, keeps entries with string `policy_id`, `title` and `text` (an invalid or missing `minimum_risk` becomes `low`), and falls back to the built-in defaults when none survive. Vectorize embeds `policy_id + title + text`, VectorDB Index writes them into `tfpolicies` keyed by `policy_id`. The store is created on first use. Loading appends: delete the store in Studio before loading a changed set, or the old records stay and crowd the search results.

**Response** — `{ indexed, source: "request" | "defaults", result: { recordsIndexed, duplicateRecordsDeleted, message } }`.

`apps/cli/policies.ts` (`npm run policies -- policies.json`) is the supported way to call it; `assets/policies.json` is the default set in that shape.

**Dependencies** — one embedding model; the `tfpolicies` Vector Store (create it in Studio so it stays manageable; the Index node creates an unlisted one otherwise).

### `tf-plan-review`

**Trigger** — API Request:

| Field | Type | Meaning |
|---|---|---|
| `changes` | `[string]` | Change facts from `extractFacts()`, each JSON-encoded |
| `totalChanges` | int | Length of `changes` |
| `summary` | string | One-paragraph plan summary with the flagged addresses; also the search query |

**Processing** — Vector Search over `tfpolicies` (query = `summary`, limit 10, certainty 0.5; hits are deduplicated by `policy_id`, highest certainty kept). Generate JSON returns one assessment per fact keyed by `address`. Generate Text writes the review comment from the facts, the assessments and the summary. The Code node validates the model output against what the model was given (known addresses only, one per address, the four risk levels only, policy ids only from the retrieved set, confidence clamped to 0–1), marks anything without a valid assessment `unclassified`, counts, and computes the verdict. Assessments that name no known resource are discarded and counted in `droppedAssessments`. A `changes` entry that is not a JSON object with an `address` becomes an `invalid-fact-N` change counted as `unclassified` (so it needs approval) and reported in `invalidFacts`; the risk level is checked against a closed list, so a value like `constructor` cannot reach the counts. Because the comment is written before this node runs, the node appends a "### Needs assessment" list of every unclassified address to the comment itself, so an approval-required change cannot be missing from what gets posted.

**Response** —

```typescript
{
  verdict: "allow" | "needs-approval" | "block",
  summary: string,
  totalChanges: number,
  counts: { critical, high, medium, low, unclassified },
  changes: Array<{
    address, type, actions, actionReason, changedAttributes, flags,
    risk: "low" | "medium" | "high" | "critical" | "unclassified",
    category, policyIds: string[], reason, mitigation, confidence,
    policyFloor: string | null      // policy whose minimum_risk raised this change above the model's rating
  }>,
  reviewComment: string | null,          // markdown
  policiesConsulted: Array<{ policyId, title, certainty, minimumRisk }>,
  droppedAssessments: number,            // model assessments that named no known resource
  invalidFacts: number                   // trigger entries that were not a JSON fact with an address
}
```

Before counting, each policy's `minimum_risk` (stored with the policy at ingest) is applied as a floor to every change that cites it; the highest floor wins and `policyFloor` names it. Citations therefore carry weight, and the assessor prompt says so: a policy is cited only when the change violates it as written.

Verdict rule: any `critical` → `block`; any `high`, `medium` or `unclassified` → `needs-approval`; otherwise `allow`. Unclassified counts against the verdict on purpose: a change the classifier did not assess is unknown risk, and unknown must not read as safe.

**Size bound** — the app and the CLI refuse a plan with more than 200 resource changes (`MAX_CHANGES` in `plan-parse.ts`) with advice to split it with `-target`; POL-10 already asks for that above 25. The review-comment prompt writes full bullets for the 12 highest findings and one compact line per remaining finding, so every medium-or-above address still appears.

**When to use it** — on every pull request that changes infrastructure, before a scheduled apply, or when auditing a plan someone else produced.

**Dependencies** — one structured-output model, one text model, the same embedding model the ingest flow used.

## Guardrails

Beyond `constitutions/default.md`:

- **Secrets are redacted before the model.** Attributes marked sensitive by Terraform, and any attribute named like a secret, are sent as names only. Values are sent for a fixed safelist of security-relevant attributes. This is enforced in `plan-parse.ts` and covered by a test.
- **One assessment per fact, keyed by address.** The classifier does not add resources, drop resources, or rename them. Anything it fails to assess is surfaced as `unclassified`, not hidden.
- **Cite only policies that were provided.** Policy ids come from the Vector Search results; the model must not invent ids or quote policy text it was not given, and the Code node drops any id that was not retrieved.
- **Plan text is data, not instructions.** Both prompts wrap the facts and policies in delimiters and say so; a resource name or tag that reads like an instruction is noted as suspicious and assessed on its actions and attributes alone.
- **Round up.** When two risk levels are plausible, the higher one is chosen. A plain tag or description change is low.
- **The gate never applies.** It produces a verdict, a comment and a decision record. Approval and override are human actions with a required justification.

### Not in scope

- Estimating cost or simulating the apply.
- Rewriting the Terraform.
- Provider types outside the lists in `plan-parse.ts` get model scoring without deterministic flags.

## Integration reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic | Hosts and executes both flows and the Vector Store | `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |
| Embedding model | Policy embeddings (ingest) and query embedding (review) | Configured in Studio on the Vectorize, Index and Vector Search nodes |
| Structured-output model | Per-change assessment | Configured in Studio on the Generate JSON node |
| Text model | Review comment | Configured in Studio on the Generate Text node |

A review makes exactly one outbound request, from the server action or from `apps/cli/review.ts` (used by the CLI and by `npm run eval`, the model regression suite in `apps/eval/`). A plan with no changes makes none; the app answers locally. `apps/ci/terraform-plan-gate.yml` shows the CLI wired into a GitHub Actions job that posts the comment on the pull request and fails on `block`.

## Environment setup

| Variable | Source |
|---|---|
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `LAMATIC_PROJECT_ID` | Studio → Settings → General → Project ID |
| `LAMATIC_API_URL` | Studio → flow → Setup → API URL. Must be `https://`; the app and CLI refuse anything else because the key travels with every request |
| `LAMATIC_TERRAFORM_PLAN_REVIEW_FLOW_ID` | `tf-plan-review` → three-dot menu → Copy Flow Id |
| `LAMATIC_TERRAFORM_POLICY_INGEST_FLOW_ID` | `tf-policy-ingest` → Copy Flow Id (only for `npm run policies`) |

## Quickstart

1. In Lamatic Studio, create a Vector Store named `tfpolicies` (Data → Context Stores; a store the Index node creates implicitly is not listed there and cannot be deleted later), then recreate the two flows from `flows/` (they are Studio's own export; re-select your model credentials on the model nodes).
2. Deploy `tf-policy-ingest`; run it once (Test in Studio with `{"run": "init", "policies": []}`, or `npm run policies` from `apps/`).
3. Deploy `tf-plan-review`; copy its Flow ID.
4. `cd kits/terraform-plan-gate/apps && cp .env.example .env.local`, fill in the values.
5. `npm install && npm run dev`, open http://localhost:3000, press **Load risky example** (or **Load real VPC plan**, a 23-resource plan from the community VPC module), then **Review plan**.

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| `Missing LAMATIC_… — copy apps/.env.example…` | No `.env.local` or a blank value | Fill in the variables listed in `apps/.env.example` and restart the dev server |
| `This does not look like a Terraform plan` | Pasted `terraform plan` text, or JSON without `resource_changes` | Use `terraform show -json tfplan` on a saved plan |
| `This is a state file, not a plan` | `terraform show -json` was run without a plan file, so it printed state | Run `terraform plan -out tfplan` first, then `terraform show -json tfplan` |
| `LAMATIC_API_URL must use https://` | The endpoint was copied without the scheme, or as `http://` | Copy the API URL from the flow's Setup panel; it starts with `https://` |
| `This plan has N resource changes; the gate reviews up to 200` | The plan is larger than one review | Split with `terraform plan -target` and review each part |
| Every change is `unclassified` | Generate JSON returned nothing, or addresses do not match | Check the node's model credential; confirm the schema in Studio still requires `address` |
| `policiesConsulted` is empty | The `tfpolicies` store is empty, or the review flow points at a different store | Run `tf-policy-ingest`; check the Vector DB field on the Vector Search node |
| Search returns nothing although the store has records | `certainty` too high for the embedding model in use | Lower certainty on the Vector Search node (0.5 works with Gemini embeddings) |
| Index reports success but the store shows 0 records | A metadata key is a reserved name (`id`) | Keep `policy_id` as the primary key; do not rename it to `id` |
| `Could not reach Lamatic` | Wrong `LAMATIC_API_URL` or no network | Re-copy the API URL from the flow's Setup panel |
| A node shows "Required Fields" after import, or a model call fails with a credential error | The `credentialId` values in `model-configs/` belong to the author's project | Re-select your own credential on the Vectorize, Index, Vector Search, Generate JSON and Generate Text nodes, then save and deploy |
| Verdict is `needs-approval` for a plan you consider routine | A medium finding, often "large blast radius" or a production tag on a replace | Read the finding; change the policy in `assets/policies.json` and reload it with `npm run policies` if the rule is wrong for your team |
| The ingest flow answers `source: "defaults"` although `policies` was sent | Every entry was dropped: `policy_id`, `title` or `text` missing or not a string, or the entries were not JSON-encoded strings | Send each policy as `JSON.stringify({ policy_id, title, text })`; `npm run policies` does this and validates the file first |
| A policy you removed from the file is still cited, or `policiesConsulted` repeats one id | The store still holds earlier loads; ingest appends | Delete the `tfpolicies` store in Studio (Data → Context Stores), run `npm run policies` once; the Index node recreates it |

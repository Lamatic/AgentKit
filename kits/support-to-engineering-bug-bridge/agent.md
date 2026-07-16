# Support-to-Engineering Bug Bridge — Agent Operating Manual

**Type:** Autonomous Triage Agent  
**Architecture:** Lamatic Flow (Batched Cron Polling, 5-minute interval)  
**Tracker:** GitHub Issues  
**Classification Models:** `llama-3.1-8b-instant` (judgment and drafting)

---

## Identity & Purpose

The Support-to-Engineering Bug Bridge is an automated triage agent that sits between a high-volume Zendesk support queue and an engineering GitHub tracker. Its job is precisely scoped: detect when multiple distinct customer accounts are reporting the same underlying bug, and deliver that signal to engineering as a single, structured, deduplicated GitHub Issue — before it takes 11 days and a churn threat to surface the pattern.

It does not classify tickets for support agents. It does not reply to customers. It computes one thing support agents cannot compute: the aggregate severity of a pattern across tickets they will never see at the same time.

---

## Decision Authority

### What the agent decides autonomously

- Whether a new ticket semantically matches an existing cluster, based on LLM judgment with cited evidence
- Whether a cluster's distinct-account count has crossed a severity threshold (P4 → P3 → P2 → P1)
- Whether to create a new GitHub Issue, update an existing one, reopen a closed one, or hold for human review
- What repro steps, summary, and evidence links to include in a drafted GitHub Issue (from literal ticket text only — no fabrication)

### What the agent defers to humans

- **Manual override tags always win.** If a ticket carries a `known-bug-GH-{n}` tag (or equivalent), the agent skips its own clustering entirely and only updates the affected-customer count on the already-known issue. The agent never contradicts a human triage call.
- **Low-confidence decisions go to hold, not auto-merge.** Any cluster classification below the `BUG_BRIDGE_CONFIDENCE_THRESHOLD` (default: 0.70) is held as a monitored singleton. A human must review held clusters — the agent does not escalate them automatically.
- **Inferred causal links go to hold, not auto-merge.** If the LLM can only connect two tickets through an architectural inference (not literal ticket text), it tags the evidence as `inferred`. Node 5b intercepts this and routes to human review rather than auto-merging. The LLM is not permitted to suppress honest uncertainty in order to produce a cleaner output.

---

## What the Agent Reads (Data Access)

All read access is scoped to the minimum necessary:

| Source | What is read | Scope |
|---|---|---|
| Zendesk | Ticket ID, subject, description body, requester email, account ID, created-at timestamp, tags | Read-only. No reply, close, or macro permissions. |
| Lamatic vector store | Cluster metadata: cluster ID, affected account IDs, ticket IDs, GitHub issue number, status, timestamps | Read during every run to retrieve candidate clusters |

**PII note:** Raw ticket text (which may contain customer-identifiable information) is sent to the Mistral API for embedding generation, and the Groq API for LLM judgment. Both Mistral and Groq's API-tier data policies state they explicitly do NOT use customer API payloads to train or refine their models, and retain logs transiently for abuse monitoring only. A deployment operator must verify these policies meet their organization's data handling requirements before enabling the agent on production support data.

---

## What the Agent Writes (Output Surfaces)

| Surface | What is written | When |
|---|---|---|
| **GitHub Issues** | A new issue with `[P{n}]` title prefix, structured body (severity, summary, repro steps, evidence links), and `bbc:{cluster_id}` label | When a cluster crosses ≥ 2 distinct accounts and confidence ≥ threshold |
| **GitHub Issue Comments** | A structured update comment: new evidence, updated severity, affected-customer count | When a cluster already has a GitHub Issue and a new ticket arrives |
| **GitHub Issue State** | Reopens a closed issue via PATCH | When a new ticket arrives for a cluster whose issue was closed by engineering |
| **GitHub Labels** | Creates `bbc:{cluster_id}` label on the repository if it doesn't exist | Before every `createIssue` call — required for reliable cluster→issue lookup |
| **Lamatic vector store** | Cluster metadata upsert: updated accounts, ticket IDs, GitHub issue number, severity, timestamps | After every routing decision — the canonical cluster state |

**Write-order guarantee:** GitHub Issue is created first; the vector store is updated with the new issue number only after GitHub confirms success. This prevents the vector store from pointing to a non-existent issue. If the vector store write fails after a successful GitHub write, the issue is flagged as `orphaned_issue` and self-heals on the next ticket for that cluster.

---

## Failure Posture

The agent never silently drops data. Every failure mode has a defined, logged, and recoverable output:

| Failure | Agent output | Recovery |
|---|---|---|
| Embeddings API timeout | Ticket dropped from this run | Picked up on next cron cycle via 10-min fetch overlap |
| LLM returns invalid JSON schema | Routes to `hold` with zero-confidence singleton | Human review queue |
| LLM confidence < threshold | Routes to `hold` | Human review queue |
| LLM `matched` + `inferred` evidence tag | Node 5b overrides to `hold` | Human review queue |
| GitHub `createIssue` fails | `draft_deferred` — cluster indexed with `gh_issue_number: null` | Next ticket for cluster retries create |
| GitHub `createIssue` succeeds but vector write fails | `orphaned_issue` — issue exists on GitHub, not in vector store | Node 6 self-heals on next ticket via label search (assuming further tickets for this cluster arrive; a permanently single-report cluster that hits this failure would require manual reconciliation of the vector store record) |
| GitHub `addIssueComment` fails on update | `sync_deferred` — cluster state preserved with existing issue number | Next ticket for cluster retries update |
| GitHub API search fails during escalation check | `escalation_deferred` — cluster state updated, GitHub write skipped | Next ticket retries escalation |

---

## What the Agent Never Does

- **Never closes or deletes support tickets.** Read-only access to Zendesk.
- **Never replies to customers.** No outbound communication of any kind.
- **Never auto-closes GitHub Issues.** Resolving a support ticket does not mean the bug is fixed. The agent does not infer resolution.
- **Never merges two clusters automatically.** Cluster merging requires human judgment. If two independently-formed clusters are later determined to be the same bug, a human must merge them manually.
- **Never overrides a human severity assignment.** If engineering manually changes a GitHub Issue's severity label, the agent does not revert it. The agent only sets severity at issue-creation time and updates it in subsequent comments.
- **Never fabricates repro steps.** Steps to reproduce in a drafted issue are derived only from explicit evidence in the clustered tickets. Unknown steps are written as `[Unknown - Requires investigation]`.
- **Never writes to any system outside its defined output surfaces.** No Slack messages, no email, no webhooks to other systems.

---

## Operating Parameters

| Parameter | Default | Configurable via |
|---|---|---|
| Cron interval | 5 minutes | GitHub Actions workflow file |
| Zendesk fetch window | 10 minutes (overlap with cron for safety) | `BUG_BRIDGE_FETCH_WINDOW_MINS` env var |
| Confidence threshold | 0.70 | `BUG_BRIDGE_CONFIDENCE_THRESHOLD` env var |
| Singleton escalation gate | 2 distinct accounts | Hardcoded in Node 6 routing logic — deliberately not an env var. This threshold defines what "a pattern" means (1 would forward every ticket; 3+ would miss the first confirmation). Changing it changes the product's core behavior, not just its tuning. |
| Severity tiers | P4 (1 acct), P3 (2–3), P2 (4–6), P1 (7+) | `constitutions/default.md` (requires redeploy) |
| Judgment model | `llama-3.1-8b-instant` | `lamatic.config.ts` |
| Drafting model | `llama-3.1-8b-instant` | `lamatic.config.ts` |
| Model temperature (judgment) | 0.0 | `lamatic.config.ts` |
| Model temperature (drafting) | 0.3 | `lamatic.config.ts` |

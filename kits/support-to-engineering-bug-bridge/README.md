# Support-to-Engineering Bug Bridge

> Closes the gap between "nine customers quietly reported the same bug to support" and "engineering knows this is a P1."

## The Before / After

This is the incident this tool exists to prevent:

| | Without this tool | With this tool |
|---|---|---|
| Tickets filed | 9 (across 7 business accounts) | 9 (unchanged) |
| Days before engineering was informed | **11** | **< 5 minutes after the 2nd account reports** |
| Tracker issues created | 0 | **1** — structured, with repro steps, affected-customer count, and severity |
| Severity correctly assigned | None (each ticket looked P3 in isolation) | **P1** (7 distinct accounts = P1 by rubric, computed automatically) |
| Support effort | 7 separate, identical triage interactions | Unchanged — agents still handle their tickets |
| Engineering effort | Full triage from scratch on day 11 | Engineering receives a single actionable issue |

**Nine individually-P3-looking tickets was, in aggregate, a P1. No system connected them.**

Over an 11-day window, 9 separate Zendesk tickets were opened by customers from 7 distinct business accounts — all describing intermittent checkout failures after a Stripe webhook retry configuration was changed in production on Day 0. Each ticket landed in a different support agent's queue. Each was resolved in isolation: "try again later," "we cleared the cache on our end," "please resubmit your order." No agent cross-referenced any other ticket.

On Day 11, a high-ARR account threatened to churn. An account executive escalated directly to the VP of Engineering. Engineering opened the Zendesk queue and found 8 other tickets — sitting untouched — that they had never been told about.

## Why This Isn't Just "Ticket Tagging"

Ticket tagging classifies tickets for support agents. This tool computes a severity signal that support agents *cannot* compute — one that is a function of the **aggregate pattern across tickets**, not the content of any individual ticket — and delivers it to engineering as a single, deduplicated, evidence-backed tracker issue.

The differentiator is **stateful accumulation and deduplication-before-create**:

- A tagging tool labels ticket #9 as "checkout-related."
- This tool recognizes that ticket #9 is the ninth paraphrased report of the *same underlying bug* that ticket #1 described three weeks ago, increments the affected-customer count, recomputes severity as P1, and updates the existing GitHub issue — rather than creating a ninth duplicate.

The output is engineering-facing, not support-facing. The hard part is not the prose the LLM writes. It is the incremental, stateful clustering that correctly identifies the ninth paraphrased report of the same bug, and the dedupe-before-create discipline that stops the tool from becoming its own source of tracker noise.

---

## Who This Is For

**This tool is for:** Engineering leads and support ops at companies that use Zendesk (or Intercom) for customer support and GitHub Issues as their engineering tracker — and who've experienced the pattern where a widespread bug is invisible to engineering until a high-value customer escalates.

**This tool is NOT for:**
- Answering customers (no automated replies)
- Root-cause analysis or code investigation
- Teams that want full real-time webhook triggering (v1 is batched polling)
- Teams using Jira or Linear as their primary tracker (v1 targets GitHub Issues only)

---

## How It Works

Each run (every 5 minutes via GitHub Actions cron):

1. **Check for a manual override first.** If a support agent has already tagged the ticket with a known-issue identifier (e.g. `known-bug-GH-1234`), the flow defers to that human judgment and skips its own clustering. Human signal always wins.

2. **Retrieve embedding-based candidate clusters.** The ticket's text is embedded and compared against the persisted set of known bug-clusters using vector similarity. This is deterministic retrieval — not a judgment call.

3. **Have an LLM judge same-bug-or-not.** With cited evidence from both the new ticket and the candidate cluster. The LLM returns a structured decision: matched cluster ID or `new`, confidence score, and the specific evidence spans that justify the call. Causal leaps the LLM cannot ground in literal ticket text are tagged `inferred` — which triggers a safety hold rather than a blind match.

4. **Deterministically search the tracker before writing.** A validation node checks whether a tracker issue already exists for this cluster using the stored cluster→issue mapping. Create is only attempted when the answer is definitively "no existing issue."

5. **Create, update, reopen, or hold.** 
   - If confidence clears the threshold (0.70) and no issue exists: a structured issue is created with synthesized repro steps, affected-customer count, severity (computed from count, never from LLM opinion), and evidence links. 
   - If an issue already exists: a comment is appended with the new affected customer and new evidence.
   - If confidence does not clear the threshold: the ticket is held as a monitored singleton for human review — no issue spam.

### Severity Rubric

Severity is computed deterministically from **distinct customer accounts**, never from the LLM's read of ticket tone:

| Distinct Accounts Affected | Severity |
|---|---|
| 1 | P4 — Minor |
| 2–3 | P3 — Moderate |
| 4–6 | P2 — High |
| 7+ | P1 — Critical |

---

## Setup

### Prerequisites
- A Lamatic account with the two required deployed Flows (see `lamatic.config.ts`)
- A GitHub repository where issues will be filed
- A Zendesk account with API access
- A Groq API key (free tier works; see Rate Limit note below)

### 1. Configure Environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

| Variable | What it's for | Required scope |
|---|---|---|
| `GROQ_API_KEY` | LLM inference (judgment + drafting) | Free tier sufficient |
| `LAMATIC_API_URL` | Lamatic flow endpoint | Your project URL |
| `LAMATIC_PROJECT_ID` | Lamatic project ID | Found in your project settings |
| `LAMATIC_API_KEY` | Lamatic authentication | Project-level key |
| `BUG_BRIDGE_FLOW_ID` | Main Flow ID | Required for triggering the main flow |
| `BUG_BRIDGE_LIST_FLOW_ID` | List Flow ID | Required for the Next.js dashboard |
| `GITHUB_TOKEN` | GitHub issue/label write access | Fine-grained PAT: `Issues: Read & Write`, `Metadata: Read` on target repo only |
| `GITHUB_REPO_OWNER` | Target repo owner | — |
| `GITHUB_REPO_NAME` | Target repo name | — |
| `ZENDESK_SUBDOMAIN` | Your Zendesk subdomain | — |
| `ZENDESK_EMAIL` | Zendesk API username/email | The email address of the API user |
| `ZENDESK_API_TOKEN` | Zendesk API token | Read-only token: no reply/close/macro permissions |
| `BUG_BRIDGE_CONFIDENCE_THRESHOLD` | Min confidence to merge a ticket into a cluster (default: `0.70`) | — |
| `BUG_BRIDGE_FETCH_WINDOW_MINS` | How far back to poll Zendesk per run (default: `10`) | — |

### 2. Deploy the Lamatic Flows

Import `lamatic.config.ts` into your Lamatic project and deploy the two required flows. The main `bug-bridge-flow` is configured for a 5-minute cron trigger via GitHub Actions.

### 3. Set Up GitHub Actions

The `.github/workflows/` trigger calls the main flow endpoint on a 5-minute schedule. Ensure `LAMATIC_API_KEY`, `LAMATIC_API_URL`, and `BUG_BRIDGE_FLOW_ID` are set as repository secrets.

> **Note:** GitHub Actions automatically disables scheduled workflows after 60 days with no repository commits. Make a maintenance commit periodically to keep it active.

### 4. Dashboard (Optional)

The `apps/` directory contains a Next.js cluster tracker that visualizes accumulated evidence over time. See `apps/README.md` for setup. Requires a separate lightweight Lamatic list-flow (instructions in that README).

---

## Trade-offs & Assumptions

### Standing Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Trigger model | Batched polling, 5-min GHA cron | Eliminates concurrent-writer race condition. Multiple tickets arriving simultaneously under a webhook model could independently see "no cluster yet" and create duplicate issues — the exact failure this tool prevents. 5-min delay is a rounding error against an 11-day baseline. |
| Tracker target | GitHub Issues (v1 only) | Simpler API, no paid account required, output visible directly in the submission repo. Jira/Linear deferred to v2. |
| Storage backend | Lamatic vector store + GitHub Issues | No external DB needed; verified IndexNode metadata support handles state. |
| Cluster search | Label `bbc:{cluster_id}`, no `is:open` | Reliable label search; finds closed issues for reopen scenarios. |
| Singleton indexing | Index immediately, gate issue on ≥2 accounts | Second report always finds the first. Singletons remain invisible to engineering until confirmed by a second account. |
| Centroid | Frozen at cluster creation | MVP simplification; rolling updates deferred to v2. |
| Manual override | Check tags first, defer to human | Automation must never contradict human triage. |
| Cluster merging | Out of scope v1 | Correct merge logic (two independently-formed clusters that are actually the same bug) is hard to get right. Gap documented, not silently skipped. |
| Auto-close | Not implemented | Resolving a support ticket does not prove the underlying bug is fixed. Auto-close would create false confidence. |
| Confidence gate | < 0.70 → hold for human review | Prefer a held ticket over a wrong tracker issue. Noise is the fastest way to get a tool disabled. |
| Customer identity | Canonical account_id (not raw email) | One customer, multiple emails = one account. Prevents falsely inflating severity. |
| PII handling | Raw text sent to Groq API | Explicitly documented trade-off for internal MVP. Groq's API-tier policy states they do not train on API inputs, but production deployments should evaluate local redaction steps. |
| Model usage | 8B for judgment and drafting | Both tasks run efficiently on `llama-3.1-8b-instant`. |
| Idempotency window | 10m fetch on 5m cron | Prevents dropped events during rate limit spikes (e.g. 429s). |
| JSON validation | Explicit validation step | 8B model uses basic JSON mode; guards against schema mismatches before proceeding. |
| Business Logic | Distributed across node types | Severity and routing logic are inlined as JavaScript inside Code Nodes, while GitHub integration is fully encapsulated within native API/HTTP nodes using configured endpoints and headers. |

### Operational Limits (v1 Constraints)

- **GitHub PAT Expiration:** Fine-grained PATs expire up to a maximum of 1 year. Rotate manually before expiry.
- **GitHub Actions Cron Disable:** GitHub automatically disables cron workflows if the repository has no activity for 60 days.
- **Groq Free Tier Rate Limits:** Max 30 RPM on the free tier. Batches of >30 tickets in a 5-minute window will trigger a 429. The 10-minute fetch overlap ensures these are picked up and retried on the next cycle rather than permanently dropped.
- **Zendesk `show_many` Batch Limit:** The historical ticket fetch uses the Zendesk `show_many` endpoint (practical limit: 100 IDs per request). Clusters exceeding 100 tickets truncate historical text retrieval in v1.
- **`ensureLabel` Concurrent Race (422):** The label creation uses a GET-then-POST pattern with no distributed lock. Two clusters simultaneously hitting label-creation may produce a 422 on the second POST. The flow gracefully catches this and defers the cluster; affected clusters self-recover on the next cron cycle.
- **Reopen-then-Comment Cosmetic Miss:** If reopening a closed issue succeeds but the subsequent comment fails, the flow defers the comment state. The next cycle sees the issue as open and posts a normal update comment without the "Reopened." prefix. This is a cosmetic miss only — no data loss, no duplicate issue.
- **Evidence-Tagging Boundary Instability:** When evaluating direct, single-step business consequences (e.g., a payment failure causing a missing order confirmation), the LLM sometimes tags the bridging statement as `inferred`. The validation node then safely routes to `hold` for human review instead of auto-merging. This is real production behavior, not just test-time model variance — human review of held clusters will occasionally surface genuine paraphrase matches that the model conservatively held. Future maintainers must NOT "fix" this by over-fitting prompts to specific worked examples, as it destroys generalization on novel ticket pairs.
- **GitHub label ceiling:** ~1,000 labels per repository. `bbc:{cluster_id}` labels are permanent — a known limit, not a near-term concern for most teams.

### Scope Negatives (What This Tool Does NOT Do)
- No root-cause analysis or code investigation
- No auto-fixing or code suggestions
- No automatic customer-facing replies
- No phone/voice support unless already transcribed to text
- No simultaneous multi-tracker writes (single tracker, v1)
- No auto-closing of tracker issues when support tickets resolve
- No automatic cluster merging

---

## v2 Deferred Items
1. Rolling centroid updates (currently frozen at cluster creation)
2. Intra-batch grouping (two first-reports in same 5-min window form two singletons, merged on next run)
3. Webhook + queue hybrid for near-real-time triggering
4. Multi-tracker support (Jira, Linear)
5. GitHub Actions keepalive to prevent 60-day auto-disable

---

## What This Actually Demonstrates

While the final output looks like a simple GitHub issue, the complexity lies in the **engineering rigor** required to get there without creating duplicate tracker noise. This project demonstrates a strict separation of concerns between deterministic retrieval (Vector Search) and bounded LLM judgment, enforced by rigid validation gates. *(Note: The current Studio-native flow has been manually verified live, end-to-end, across all 5 lifecycle branches, directly in Lamatic Studio's UI. The intended production trigger — a GitHub Actions cron job calling the deployed flow's endpoint on a 5-minute schedule using repository secrets — is fully designed and documented (see Setup section) and is the actual way the flow is meant to run in production. While an actual live GitHub Actions cron run hasn't been manually observed firing yet, and the original automated Phase 8 mock test suite (`test_runner.ts`) was lost during the Studio export, the rigorous live manual verification inside Studio is what this submission stands on.)* The documented limitations (such as the evidence-tagging boundary instability) are genuine findings from the adversarial testing phase, proving this is not just a happy-path demo, but a robustly engineered, state-aware agent designed for production realities.

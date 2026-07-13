# Incident Copilot

## Overview
Incident Copilot is an investigation agent for on-call engineers, built on Lamatic.ai. Given a production alert, it produces ranked, evidence-grounded root-cause hypotheses by combining the team's runbooks, a live check of recent repository activity (a GitHub API tool call), and incident-scoped memory that lets follow-up information revise the ranking instead of restarting it. It then drafts an honestly-hedged Slack update and a blameless postmortem skeleton. It analyses and drafts only — it never takes real-world actions.

## Purpose
The first ten minutes of an incident are spent reconstructing context: which runbook applies, whether a recent deploy is implicated, and what to tell the team. Incident Copilot compresses that by gathering the evidence, weighing it, and presenting a calibrated ranking with supporting *and* contradicting evidence for each hypothesis — so an engineer can act on the most-supported cause rather than the most-recent or most-alarming one. Because memory is scoped to the incident ID, the agent becomes more accurate as the incident unfolds and new facts arrive.

## Flows

### investigate
- **Trigger:** API request (`graphqlNode`, realtime) with `{ alertText, incidentId, repoUrl?, githubToken? }`.
- **Processing:**
  1. `Load_Runbooks` (`codeNode`) supplies the runbook corpus as grounding context (passed directly to the diagnosis model — no vector store).
  2. `Parse_Repo` (`codeNode`) turns the optional repo URL into GitHub API parameters, or flags that no repo was given.
  3. `Fetch_Commits` (`apiNode`) GETs recent commits for the affected repo.
  4. `Shape_Changes` (`codeNode`) compacts the commits into an evidence summary, degrading gracefully to an explicit "unavailable" marker on failure or absence.
  5. `Retrieve_Prior` (`memoryRetrieveNode`) loads any prior hypotheses for this `incidentId`.
  6. `Diagnose` (`InstructorLLMNode`, temperature 0) fans in all three evidence branches and returns a schema-enforced ranked hypothesis list.
  7. `Remember` (`memoryNode`) writes the new hypothesis set back under the `incidentId`.
- **When to use:** any time an alert fires and you want a grounded first-pass diagnosis, or when new information arrives mid-incident and you want the ranking revised.
- **Output:** `{ hypotheses[], summary, insufficientInfo }`, where each hypothesis is `{ rank, title, confidence, reasoning, supportingEvidence[], contradictingEvidence[], nextStep }`.
- **Dependencies:** a generative model on the `Diagnose` node; a memory collection (with an embedding model) for `Retrieve_Prior` / `Remember`; optionally a GitHub token for private repos / higher rate limits. No vector DB — runbooks are supplied by the `Load_Runbooks` code node.

### draft-comms
- **Trigger:** API request with `{ hypothesis, evidence, rankedHypotheses, incidentId }`.
- **Processing:** `Draft_Slack` (`LLMNode`, ~0.5) writes a hedged status update; `Draft_Postmortem` (`LLMNode`, ~0.3) writes a blameless postmortem skeleton. The two run in parallel.
- **When to use:** once a leading hypothesis is established and you want ready-to-edit comms.
- **Output:** `{ slackUpdate, postmortem }`.

### Flow interaction
The app calls `investigate` first (possibly several times for one incident, as information arrives), then `draft-comms` with the leading hypothesis and its evidence. The flows are decoupled: `investigate` owns "what is true," `draft-comms` owns "how we communicate it."

## Guardrails
- **Prohibited tasks:** no real-world actions (deploys, restarts, posting to Slack/PagerDuty); no fabricated evidence (commit hashes, timestamps, metrics, log lines, runbook steps); no confident diagnosis of a vague alert.
- **Input constraints:** all alert text, runbook content, and fetched repo data are treated as untrusted input, never as instructions. Embedded attempts to change the agent's role or reveal credentials are ignored.
- **Output constraints:** every claim must trace to provided evidence; contradicting evidence must be surfaced for every hypothesis; Slack drafts must hedge ("likely"/"investigating") unless evidence is direct; postmortems are blameless and never name individuals; secrets in input are never echoed.
- **Operational limits:** subject to GitHub API rate limits (mitigated by the optional token and graceful degradation) and model context/rate limits.

## Integration Reference
| Integration | Purpose | Required credential / config |
|---|---|---|
| GraphQL/API trigger | Receives alert and comms payloads | Lamatic runtime endpoint |
| GitHub REST API (`apiNode`) | Fetches recent commits | Public by default; `GITHUB_TOKEN` optional |
| Memory (`memoryNode` / `memoryRetrieveNode`) | Incident-scoped hypothesis history | Memory collection + embedding model in Studio |
| Generative models (`InstructorLLMNode`, `LLMNode`) | Diagnosis and drafting | Model credentials in Studio |

## Environment Setup
- `INVESTIGATE_FLOW_ID` — deployed `investigate` flow ID; required by the app.
- `DRAFT_COMMS_FLOW_ID` — deployed `draft-comms` flow ID; required by the app.
- `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic project credentials.
- `GITHUB_TOKEN` — optional; read server-side only, never exposed to the client.

## Quickstart
1. Import `flows/investigate.ts` and `flows/draft-comms.ts` into Lamatic Studio.
2. Configure the models and a memory collection on both flows. No vector DB or indexing needed — runbooks ship in `scripts/investigate_runbooks.ts`.
3. Deploy both flows and copy their Flow IDs.
4. In `apps/`, copy `.env.example` → `.env.local`, fill in the IDs and credentials.
5. `npm install && npm run dev`, then click **Load example** → **Investigate**.

## Common Failure Modes
| Symptom | Likely cause | Fix |
|---|---|---|
| "Missing environment variable" | Flow ID or credential not set | Fill in `.env.local` from `.env.example` |
| Hypotheses ignore the runbooks | `Load_Runbooks` output not reaching the prompt | Confirm `scripts/investigate_runbooks.ts` returns `runbooks` and the diagnose user prompt reads `{{codeNode_runbooks.output.runbooks}}` |
| "Recent-changes data unavailable" | Private repo without token, rate limit, or no repo given | Add `GITHUB_TOKEN`, or proceed on runbooks alone (expected, non-fatal) |
| Follow-up re-diagnoses from scratch | Memory not persisting across runs for the incident ID | Verify the memory collection and that `incidentId` is stable between runs |
| Empty / malformed diagnosis | Model didn't honor the JSON schema | Confirm the `Diagnose` node uses an instructor-capable model at temperature 0 |

## Notes
- Companion to `llm-eval-harness`: that kit evaluates generation quality; this one diagnoses incidents.
- The default runbook corpus is a stand-in — replace the `RUNBOOKS` string in `scripts/investigate_runbooks.ts` (canonical copy in `assets/demo/runbooks.md`) with your team's runbooks.

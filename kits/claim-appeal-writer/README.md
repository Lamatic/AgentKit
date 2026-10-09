# Claim Appeal Writer

> Upload your insurance denial letter and your policy. Get back a cited, ready-to-send appeal letter, an evidence checklist, and your deadline.

**Type:** Kit (3 Lamatic flows + Next.js app) · **Scope (v1):** US health insurance denials


---

## The problem

Insurers deny a meaningful share of claims, and most denials are never appealed — even though appeals frequently succeed. Appealing well means doing three hard things at once: decoding the denial letter, finding the clauses in a 100-page policy that actually govern the claim, and knowing the procedural rules and deadline for your state and plan type. Then writing a formal letter that cites all three.

## What this kit does

| Step | Flow | What happens |
|---|---|---|
| 1 | `index-policy` | Your policy document is chunked, embedded, and indexed in Lamatic's managed vector store, scoped to a `policyId`. |
| 2 | `analyze-denial` | The denial letter is parsed into structured facts: what was denied, each reason (categorised), plan type, stated appeal window, confidence, and what a human should double-check. **You confirm these in the app before anything is drafted.** |
| 3 | `draft-appeal` | The agent retrieves the relevant policy clauses, web-searches the appeal rules for your state and plan type, and drafts the letter — one section per denial reason, quoting the policy verbatim with excerpt labels — plus a deadline, evidence checklist, next steps, and escalation path. |

**Design principle — no fabrication.** Every policy citation traces to a retrieved excerpt from *your* policy. Every regulatory reference traces to a retrieved source. If the policy doesn't support a rebuttal, the letter says so and formally demands that the insurer identify the provision it relied upon, the full claim file, and the clinical criteria used — which is itself a strong appeal move.

## Try it in 60 seconds

The app ships with synthetic sample documents (`assets/`): a 9-section health plan policy and four denial letters (medical necessity, prior authorization, out-of-network, experimental/not covered). Each denial has a genuine rebuttal hiding in the policy — for example, the MRI denial for "no conservative treatment" meets §4.1, which requires only six weeks of conservative care, and the patient had eight. Click **Try with sample documents** on the first screen. A PDF version of the first denial letter is included for testing the upload path.

## Setup

### 1. Build and deploy the flows in Lamatic Studio

1. Sign in at [studio.lamatic.ai](https://studio.lamatic.ai) and create a project.
2. Create the three flows using `flows/*.ts` as the blueprint (node-by-node walkthroughs are in each file's header and in [`agent.md`](./agent.md)). Paste the prompts from `prompts/` and the code-node scripts from `scripts/`.
3. Select providers in Studio:
   - an **embedding model** and the project **vector DB** for `index-policy` and `draft-appeal`;
   - a **chat model** for the Generate Text / Generate JSON nodes (a strong reasoning model is recommended for the letter);
   - a **Serper** credential (`SERPER_API_KEY`) for the Web Search node.
4. **Deploy** all three flows and copy each Flow ID from the details panel.

### 2. Run the app

```bash
cd kits/claim-appeal-writer/apps
cp .env.example .env.local      # fill in credentials + the three flow IDs
npm install
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Where to find it |
|---|---|
| `LAMATIC_API_URL` | Studio → Settings → API Docs → Endpoint |
| `LAMATIC_PROJECT_ID` | Studio → Settings → Project |
| `LAMATIC_API_KEY` | Studio → Settings → API Keys |
| `CLAIM_APPEAL_INDEX_POLICY` | Flow ID of `index-policy` |
| `CLAIM_APPEAL_ANALYZE_DENIAL` | Flow ID of `analyze-denial` |
| `CLAIM_APPEAL_DRAFT_APPEAL` | Flow ID of `draft-appeal` |

### Deploy to Vercel

Use the deploy link in `lamatic.config.ts` (root directory `kits/claim-appeal-writer/apps`) and set the same six variables.

## How the app works

- **Upload** — drop a policy PDF and a denial letter PDF (or paste text), pick your state, optionally add context ("my doctor ordered this after 8 weeks of PT"). PDFs are converted to text server-side with `pdf-parse`; flows receive text, so no file hosting is needed.
- **Confirm** — the extracted denial facts are shown as an editable card; anything the agent flagged in `missingInfo` is highlighted.
- **Appeal** — the letter with a citation side panel showing the exact policy excerpts it quoted, a deadline banner, the evidence checklist, next steps, and the escalation note. Copy or download the letter.

## Folder layout

```
claim-appeal-writer/
├── lamatic.config.ts      # kit metadata + 3 steps
├── agent.md               # agent identity & capability doc
├── constitutions/         # guardrails
├── flows/                 # index-policy.ts, analyze-denial.ts, draft-appeal.ts
├── prompts/               # externalised system/user prompts
├── scripts/               # code-node scripts
├── model-configs/         # generation parameters
├── assets/                # synthetic sample policy + denial letters
└── apps/                  # Next.js app
```

## Tradeoffs and limits

- **Text in, not files in.** Flows accept extracted text rather than file URLs so the kit runs locally with zero extra services. The Next.js app extracts PDF text with `pdf-parse` before calling the flow. Swap in Lamatic's *Extract from File* node if your app already hosts uploads.
- **US health insurance only.** The argument patterns (medical necessity, prior auth, network adequacy, experimental exclusions, ERISA/ACA appeal rights) are health-specific. Other lines are a prompt-and-taxonomy change, not an architecture change.
- **No authentication (v1).** The app scopes retrieval by `policyId` so one policy's clauses never leak into another policy's appeal, but that is correctness, not authorization. Before deploying to real users, bind `policyId` to an authenticated owner server-side — see "Security model and production considerations" in [`agent.md`](./agent.md).
- **A draft, not advice.** Every output carries a disclaimer. Deadlines are surfaced with their source (`letter`, `regulation`, or `unknown`) and never computed from thin air.

## Roadmap

- Cron-triggered deadline reminders (Lamatic scheduled trigger → SMTP / Twilio).
- Insurer appeals-address lookup.
- Auto, home, travel and disability lines; non-US jurisdictions.

## License

MIT, as per the AgentKit repository.

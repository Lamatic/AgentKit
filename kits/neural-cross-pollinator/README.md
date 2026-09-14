# Neural Cross-Pollinator

Finds genuine structural parallels between two unrelated domains,
proposes a mechanism transferred from one to the other as a candidate
innovation, and critically evaluates whether that idea is actually
novel — rather than assuming every AI-generated analogy is a
breakthrough.

## How It Works

API Request (domainA, domainB)
│
▼
Analyze Domain A ──┐
├─► Find Structural Parallels
Analyze Domain B ──┘ │
▼
Transfer Mechanism
│
▼
Evaluate Innovation
│
┌────────┴────────┐
verdict: strong verdict: weak
│ │
Present Success Present Caveat
└────────┬────────┘
▼
API Response


Six reasoning stages, one honest evaluator, and a branch that
presents the result differently depending on whether the idea holds
up under scrutiny.

## Example

**Input:**
```json
{ "domainA": "immune system", "domainB": "cybersecurity threat detection" }
```

**A parallel it found:**
> Antigen-presenting cells processing pathogens and displaying
> peptide-MHC complexes ↔ SIEM/log ingestion normalizing raw logs
> into structured events — both act as preprocessing hubs that
> transform heterogeneous raw input into a standardized
> representation downstream systems can consume.

**Verdict on the proposed innovation:** `weak` — the evaluator
correctly identified that the proposed "Immune Log Processor" was a
re-labeling of existing SIEM enrichment pipelines (Elastic Common
Schema, MITRE ATT&CK-aligned models), not a genuinely new mechanism.

## Setup

1. Clone this repo and `cd kits/neural-cross-pollinator/apps`
2. `npm install`
3. `cp .env.example .env.local`
4. Fill in the values (see table below)
5. `npm run dev`
6. Open `http://localhost:3000`

| Variable | Where to get it |
|---|---|
| `NEURAL_CROSS_POLLINATOR_FLOW_ID` | Your deployed flow's ID in Lamatic Studio |
| `LAMATIC_API_KEY` | Lamatic account settings |
| `LAMATIC_API_URL` | Lamatic Studio → API Docs page |
| `LAMATIC_PROJECT_ID` | Lamatic Studio → API Docs page |

## Architecture Notes

- All 5 reasoning nodes use **Generate JSON** (structured output),
  not free-text generation — this forces the model to return
  comparable fields (entities, mechanisms, constraints, feedback
  loops, adaptation patterns) rather than a prose paragraph.
- The evaluation stage is deliberately adversarial: see
  [`constitutions/default.md`](./constitutions/default.md) for why it
  must not default to positive verdicts.
- Live demo flow deployed at Lamatic; see `agent.md` for the full
  flow breakdown.

## License
Same as the parent repository.
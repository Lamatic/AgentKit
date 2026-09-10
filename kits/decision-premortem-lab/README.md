# Decision Pre-Mortem Lab

Decision Pre-Mortem Lab helps product and operations teams find fragile assumptions before an expensive commitment. It converts a proposed decision and its available evidence into a structured decision brief: an assumption ledger, ranked failure modes, leading indicators, small validation experiments, and explicit stop or continue criteria.

## Why it exists

Teams often discuss a decision as if the proposed plan were already correct. Risks remain vague, assumptions are mistaken for facts, and validation happens only after implementation. A conventional brainstorming assistant can produce a long risk list, but it rarely distinguishes evidence quality or tells the team what to test first.

This kit creates a disciplined pre-mortem:

1. Separate supported, uncertain, and unsupported assumptions.
2. Rate likelihood and impact independently.
3. Attach observable warning signals to each failure mode.
4. Convert uncertainty into no more than three measurable, time-boxed experiments.
5. Finish with a clear `proceed`, `pilot`, `revise`, or `stop` recommendation.

## Architecture

```text
Next.js decision form
        |
        v
Lamatic API Request trigger
        |
        v
Generate JSON (guardrailed pre-mortem prompt + structured schema)
        |
        v
Lamatic API Response
        |
        v
Assumption, risk, experiment, and recommendation dashboard
```

The LLM performs qualitative synthesis, while the schema constrains the result into reviewable fields. It never executes the decision or contacts stakeholders.

## Input

| Field | Required | Purpose |
|---|---:|---|
| `decision` | Yes | The commitment under consideration |
| `context` | No | Known facts, evidence, and stakeholder views |
| `constraints` | No | Budget, time, staffing, technical, or policy limits |
| `timeHorizon` | No | When the decision is expected to work |

## Output

- `decisionSummary`
- `assumptions[]` with evidence status, rationale, and fastest test
- `failureModes[]` with likelihood, impact, warning signals, mitigation, and owner role
- `experiments[]` with hypothesis, method, success metric, stop condition, effort, and timebox
- `recommendation` with status, rationale, and confidence
- `nextActions[]`

## Run locally

```bash
cd kits/decision-premortem-lab/apps
cp .env.example .env.local
npm install
npm run dev
```

Fill `.env.local` with the Lamatic project values listed in `.env.example`. The interface includes a clearly labelled illustrative report so reviewers can inspect the complete dashboard without credentials; live analysis always calls the deployed Lamatic flow.

## Quality checks

```bash
npm run check
npm run build
```

## Safety and limitations

- User text is treated as untrusted data and cannot replace the system rules.
- The flow does not invent probabilities or claim that a qualitative rating is measured risk.
- Missing evidence is made visible rather than silently filled in.
- The tool does not provide legal, medical, or financial advice.
- A pre-mortem can expose uncertainty, but it cannot prove that a decision will succeed.
- Human owners remain responsible for experiments and the final decision.

## Author

Reuben Philipose

# ChangeGraph

ChangeGraph is a pre-deployment release-intelligence kit for Lamatic workflows.

It compares baseline and candidate workflow exports, identifies structural and semantic changes, calculates downstream blast radius, assigns a deterministic risk score, and generates a safe-promotion decision with targeted tests and rollback guidance.

## Why ChangeGraph

AI workflow releases can introduce risk through seemingly small modifications:

- Prompt changes
- Model or temperature changes
- Input and output schema changes
- Permission expansion
- External write tools
- Retry removal
- Fallback removal
- Graph-edge changes
- Safety-instruction changes

ChangeGraph provides a structured review layer before a candidate workflow is promoted.

It answers:

- What changed?
- Which components are directly affected?
- Which downstream paths may be affected?
- How risky is the release?
- Should it be promoted, manually reviewed, or blocked?
- What tests should be executed?
- What should be restored during rollback?

## Features

- Baseline and candidate ZIP comparison
- Browser-side archive reading
- Lamatic workflow parsing
- Prompt and model-configuration comparison
- Structural graph diffing
- Downstream blast-radius analysis
- Deterministic risk scoring
- Lamatic-powered semantic impact analysis
- Targeted test generation
- Deployment-checklist generation
- Rollback-manifest generation
- Secret redaction before server transmission
- Safe deterministic fallbacks for invalid AI output
- Responsive Next.js dashboard

## Architecture

```text
Baseline ZIP                 Candidate ZIP
     │                            │
     └──────── Browser processing ┘
                    │
             Secret redaction
                    │
              Flow parsing
                    │
             Structural diff
                    │
          Blast-radius analysis
                    │
        Deterministic risk scoring
                    │
       Sanitized change package only
                    │
             Next.js API route
                    │
       ┌────────────┴─────────────┐
       │                          │
Semantic impact flow      Release-plan flow
       │                          │
       └────────────┬─────────────┘
                    │
         Validated release report
```

The uploaded TypeScript files are parsed but never executed.

## Lamatic flows

### `analyze-change-impact`

Analyzes the operational and semantic meaning of the detected changes.

Inputs:

- `flowPurpose`
- `baselineVersion`
- `candidateVersion`
- `changePackage`
- `releaseContext`

Expected output:

- Analysis summary
- Overall impact level
- Human-review requirement
- Findings
- Cross-cutting risks
- Assumptions
- Unknowns
- Recommended checks

### `generate-release-plan`

Transforms the change analysis and deterministic risk result into an actionable release plan.

Inputs:

- `flowPurpose`
- `baselineVersion`
- `candidateVersion`
- `releaseContext`
- `changePackage`
- `semanticAnalysis`
- `riskScore`
- `promotionDecision`

Expected output:

- Decision summary
- Promotion decision
- Risk score
- Release blockers
- Targeted tests
- Deployment checklist
- Rollback manifest
- Release notes
- Assumptions
- Unknowns

## Deterministic risk model

The Lamatic model does not determine the authoritative risk score.

ChangeGraph calculates the score using deterministic rules:

| Change | Score |
|---|---:|
| Breaking schema change | +30 |
| Fallback removed | +25 |
| Permission scope expanded | +25 |
| Safety instruction removed | +25 |
| External write tool introduced | +20 |
| Graph edge removed | +15 |
| Retry protection removed | +15 |
| Model changed | +10 |
| Temperature increased | +10 |
| Prompt wording changed | +5 |
| Low blast radius | +3 |
| Medium blast radius | +7 |
| High blast radius | +12 |

The final score is capped at `100`.

## Promotion policy

| Risk score | Decision |
|---:|---|
| `0–29` | `safe_to_promote` |
| `30–69` | `manual_review_required` |
| `70–100` | `block_release` |

The deterministic score and decision remain authoritative throughout the pipeline.

## AI reliability and fallbacks

Lamatic enriches the report with semantic explanations, tests, and release planning.

Because language-model output may occasionally be incomplete, every Lamatic response is validated.

```text
Valid Lamatic response
→ Use the validated semantic analysis or release plan

Invalid Lamatic response
→ Generate a conservative deterministic fallback

Risk score and promotion decision
→ Remain deterministic and authoritative
```

Fallback behavior ensures that malformed AI output cannot:

- Crash the analysis
- Reduce the deterministic risk score
- Remove a release blocker
- Convert `block_release` into a weaker decision
- Prevent test or rollback guidance from being generated

## Privacy and security

- ZIP archives are initially processed in the browser.
- Uploaded TypeScript is parsed and never executed.
- Secrets are redacted before the structured change package is sent.
- Lamatic credentials are used only by the server-side API route.
- `.env.local` is excluded from Git.
- Only placeholder values are provided in `.env.example`.
- Incoming API requests are schema-validated.
- The API route applies a request-size limit.

## Project structure

```text
changegraph-release-intelligence/
├── lamatic.config.ts
├── README.md
├── agent.md
├── .env.example
├── flows/
├── prompts/
├── model-configs/
├── constitutions/
└── apps/
    ├── actions/
    ├── app/
    ├── components/
    ├── lib/
    ├── types/
    ├── package.json
    └── .env.example
```

## Requirements

- Node.js 18 or later
- npm 9 or later
- A Lamatic account
- Two deployed Lamatic flows
- Lamatic API credentials

## Local setup

Move into the application:

```bash
cd kits/changegraph-release-intelligence/apps
```

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Add real values to `.env.local`:

```env
LAMATIC_API_KEY=your_real_api_key
LAMATIC_PROJECT_ID=your_real_project_id
LAMATIC_API_URL=your_real_api_url

ANALYZE_CHANGE_IMPACT_FLOW_ID=your_real_flow_id
GENERATE_RELEASE_PLAN_FLOW_ID=your_real_flow_id
```

Run the application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Usage

1. Export a baseline Lamatic workflow.
2. Export the candidate workflow.
3. Upload both ZIP files.
4. Enter the workflow purpose.
5. Enter the baseline and candidate versions.
6. Describe the release context.
7. Run the analysis.
8. Review the structural changes, blast radius, risk score, semantic findings, tests, checklist, and rollback manifest.

## Validation commands

Run from `apps/`:

```bash
npm exec tsc -- --noEmit
npm run lint
npm run build
npm audit --omit=dev
```

## Demonstration scenarios

### No change

```text
Expected risk: 0
Expected decision: safe_to_promote
```

### Moderate-risk release

Example changes:

- Prompt wording update
- Temperature increase
- Permission expansion

Expected decision:

```text
manual_review_required
```

### High-risk release

Example changes:

- Breaking schema change
- Permission expansion
- Safety-instruction removal
- External write capability
- Fallback or retry removal

Expected decision:

```text
block_release
```

## Limitations

- The parser targets exported Lamatic workflow structures and JSON-compatible TypeScript constants.
- Uploaded TypeScript files are parsed but never executed.
- Semantic explanations depend on the configured Lamatic model.
- Deterministic fallbacks may be less descriptive than valid model-generated output.
- Risk weights are intentionally conservative and may require calibration for different organizations.
- ChangeGraph provides release guidance; it does not directly deploy or roll back workflows.

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zod
- JSZip
- Lamatic SDK
- Lucide React

## Author

**Mayank Verma**

GitHub username: `Mayankverma210405`
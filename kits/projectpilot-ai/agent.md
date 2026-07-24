# ProjectPilot AI Agent

## Overview

ProjectPilot AI is a three-stage agentic mentor for engineering students planning their final year project. It moves a student from raw preferences (branch, interest, skill level, duration, team type) to a specific project idea, a grounded technical blueprint, and a complete execution plan — with every stage explicitly conditioned on the student's actual choices, not generic templates.

## Purpose

Final year project planning tools often stop at idea generation and leave the student to figure out the stack, timeline, and defense prep alone. ProjectPilot AI chains three purpose-built agents so each stage builds on the confirmed output of the last, while enforcing that every output stays grounded in the specific project and technologies chosen — a deliberate guardrail added after early testing showed generic LLM output ignoring the actual selected project.

## Flow 1: Discovery

### Trigger
The synchronous API Request accepts `branch`, `interest`, `skillLevel`, `duration`, and `teamType`.

### Processing
The Generate JSON node produces 5-8 ranked project ideas, each with a difficulty rating, industry relevance, and an innovation score out of 10, tailored to the student's inputs.

### Response
The API Response exposes `ideas` — an array of `{ title, difficulty, industryRelevance, innovationScore }`.

### When to use
Use at the start of final year project planning, once a student knows their branch and rough area of interest but hasn't committed to a specific idea.

### Dependencies
- Lamatic synchronous API runtime
- A structured-output-capable generative model (this kit uses Groq `llama-3.3-70b-versatile`)

## Flow 2: Blueprint

### Trigger
The synchronous API Request accepts `selectedIdea` and `skillLevel`.

### Processing
The Generate JSON node recommends a frontend, backend, database, AI/ML framework, and deployment platform specific to the chosen idea, along with a short architecture explanation and 2-3 relevant datasets or APIs.

### Response
The API Response exposes `frontend`, `backend`, `database`, `aiFrameworks`, `deployment`, `architectureExplanation`, and `datasets`.

### When to use
Use immediately after a student selects one idea from the Discovery stage.

### Dependencies
- Lamatic synchronous API runtime
- The same structured-output-capable generative model as Discovery

## Flow 3: Execution

### Trigger
The synchronous API Request accepts `selectedIdea`, `blueprint` (JSON-stringified output from Blueprint), and `duration`.

### Processing
The Generate JSON node produces a week-by-week roadmap, a ~150-word abstract, five viva questions (beginner to advanced), and three ATS-friendly resume bullet points — all required to explicitly reference the specific project and its actual technology stack rather than a generic or unrelated project template.

### Response
The API Response exposes `roadmap` (array of `{ week, task }`), `abstract`, `vivaQuestions`, and `resumeBullets`.

### When to use
Use once the student has confirmed the technical blueprint and is ready to plan execution and defense prep.

### Dependencies
- Lamatic synchronous API runtime
- The same structured-output-capable generative model as the other two flows

## Guardrails

- Never generate a generic or unrelated project — every output across all three flows must explicitly reference the specific project idea and, where applicable, the confirmed technology stack.
- Never fabricate an idea, stack recommendation, or roadmap step that ignores the student's stated branch, interest, skill level, or duration.
- Treat the student's inputs as the sole source of truth for grounding; do not default to common training-data patterns (e.g. generic "machine learning project" templates) when specific input is provided.
- Recommendations are suggestions for a student and their supervisor to evaluate — never present output as a guarantee of project approval or academic success.
- Avoid recommending datasets, APIs, or tools that require paid licenses without noting the cost.

## Integration reference

| Service | Purpose | Credential |
|---|---|---|
| Lamatic API | Executes the three deployed flows | `LAMATIC_API_KEY` |
| Lamatic project | Selects the project runtime | `LAMATIC_PROJECT_ID`, `LAMATIC_API_URL` |
| Deployed flows | Selects each stage's workflow | `DISCOVERY_FLOW_ID`, `BLUEPRINT_FLOW_ID`, `EXECUTION_FLOW_ID` |
| Model provider | Produces schema-constrained output | Stored in Lamatic (Groq), never in the app |

## Environment setup

| Variable | Required | Source | Purpose |
|---|:---:|---|---|
| `LAMATIC_API_KEY` | Yes | Lamatic Settings → API Keys | Authenticates server-side flow execution. |
| `LAMATIC_PROJECT_ID` | Yes | Lamatic project settings/API Docs | Identifies the deployed project. |
| `LAMATIC_API_URL` | Yes | Lamatic API Docs | Base endpoint for the project runtime. |
| `DISCOVERY_FLOW_ID` | Yes | Flow menu → Copy Flow ID | Identifies the discovery-flow deployment. |
| `BLUEPRINT_FLOW_ID` | Yes | Flow menu → Copy Flow ID | Identifies the blueprint-flow deployment. |
| `EXECUTION_FLOW_ID` | Yes | Flow menu → Copy Flow ID | Identifies the execution-flow deployment. |

## Quickstart

1. Deploy all three Lamatic flows and configure their shared model credential.
2. Copy `apps/.env.example` to `apps/.env.local`.
3. Fill the six required Lamatic values.
4. Run `npm install --legacy-peer-deps` from `apps/`.
5. Run `npm run dev` and open the local URL.
6. Fill the form, generate ideas, select one, review the blueprint, then generate the execution plan.

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Blueprint or execution fields render empty | Wrong Flow ID in `.env.local`, or the API Response node's output mapping is missing a field | Verify each `*_FLOW_ID` matches the correct flow in Studio; check Output Variables mapping on the API Response node. |
| Roadmap/abstract reference a generic or unrelated project | Prompt isn't strongly grounding output in the specific input | Strengthen the system/user prompt to explicitly forbid generic output, as done in this kit's `execution-flow` prompt. |
| "Missing environment variable" error | One or more application environment variables are missing | Compare `.env.local` with `.env.example` and restart the dev server. |
| Deploy fails with a generic Edge deployment error | Transient Lamatic platform issue, or the flow's Active toggle is off | Confirm the flow is toggled Active before deploying; retry; check status.lamatic.ai. |
| Model returns invalid JSON | Prompt is too long/complex for the model to follow reliably | Simplify the prompt while keeping the core grounding instruction. |
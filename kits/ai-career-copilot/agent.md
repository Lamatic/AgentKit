# ai-career-copilot

## Overview

AI Career Copilot is an AI-powered career assistant that turns raw resume text and a target domain into actionable career guidance. The system is implemented as a single Lamatic AgentKit flow exposed via a GraphQL API, where each stage enriches the prior stage’s output (skills → gaps → roles → readiness → roadmap → projects → interview prep). It is primarily invoked by a web UI (Next.js) or any backend service capable of making authenticated GraphQL requests to a deployed Lamatic project. The flow relies on Lamatic’s hosted execution environment and LLM-backed `InstructorLLMNode` prompt steps; it also uses a GraphQL request/response boundary to integrate with external callers.

---

## Purpose

The goal of this agent system is to help a user understand where they stand for a chosen career direction and what to do next. After the agent runs, a user should have a clear inventory of their current skills, a concrete list of missing skills relevant to their target domain, and a set of plausible roles to pursue.

Beyond diagnostics, the system produces an execution plan: a structured learning roadmap, practical project ideas to build portfolio evidence, and tailored interview questions to rehearse. The overall outcome is a reduction in ambiguity and decision paralysis—turning “I have a resume; what should I do?” into a prioritized, domain-specific plan.

Because this project is a single-flow pipeline, all sub-goals (analysis, recommendations, planning, and preparation) are produced in one invocation. This makes it suitable for interactive UX (one “Analyze” action) and for programmatic use in other systems (e.g., HR tools, learning platforms, or coaching assistants) that want a single structured response.

---

## Flows

### `AI Career Copilot Flow`

- Trigger
  - Invoked via a GraphQL API call to a deployed Lamatic project/endpoint.
  - Expected input shape (conceptual):
    - `resumeText` — the user’s resume content as plain text
    - `domain` — the target domain (e.g., “Web Development”, “Data Science”)
  - The UI described in the project README collects these inputs (“resume text” + “target domain”) and submits them to the Lamatic GraphQL endpoint using a configured flow id.

- What it does
  1. `API Request (graphqlNode)`
     - Accepts the incoming GraphQL request payload from the caller.
     - Establishes the request context and makes input fields available to downstream nodes.
  2. `Skills Extraction (codeNode)`
     - Parses the user-provided resume text and normalizes it into a structured skills list.
     - Produces at minimum:
       - `skills` — extracted skills (likely as an array or delimited list)
       - `domain` — the selected target domain passed through for downstream prompts
  3. `Missing Skills (InstructorLLMNode)`
     - Uses an “expert career assistant” prompt to compare current `skills` against the chosen `domain`.
     - Outputs a set of missing or underrepresented skills (gap analysis).
  4. `Career Role Suggestion (InstructorLLMNode)`
     - Uses an “expert career advisor” prompt to propose relevant job roles aligned to the user’s current skills and target `domain`.
     - Produces a shortlist of roles and (typically) brief justification.
  5. `Readiness Score (InstructorLLMNode)`
     - Uses an “expert career evaluator” prompt to estimate how ready the user is for the suggested direction based on current vs missing skills.
     - Produces a readiness score and supporting rationale/criteria.
  6. `Generate Roadmap (InstructorLLMNode)`
     - Uses an “expert career mentor” prompt to create a structured learning roadmap.
     - Roadmap is based on current `skills` plus the missing skills output from the earlier gap step.
  7. `Projects (InstructorLLMNode)`
     - Uses an “expert software mentor” prompt to suggest practical projects.
     - Project ideas are designed to build the missing skills and produce portfolio artifacts.
  8. `Interview Questions (InstructorLLMNode)`
     - Uses a “technical interviewer” prompt to generate tailored interview questions.
     - The prompt indicates generating a set of questions (e.g., 5) based on skills and domain.
  9. `API Response (graphqlResponseNode)`
     - Packages outputs from prior nodes into the GraphQL response sent back to the caller.

- When to use this flow
  - Use when a user has resume text (or a skills summary derived from it) and wants end-to-end career guidance in one step.
  - Best for interactive “single-click” analysis where the caller wants skills extraction plus recommendations and preparation artifacts.
  - Route to this flow when the target is a general career planning deliverable (roles + gaps + roadmap + projects + interview questions), not just a single sub-task.

- Output
  - Returns a single GraphQL response that contains the aggregated analysis results produced by the pipeline.
  - Expected high-level fields (names may vary by implementation, but content is produced by these nodes):
    - Extracted `skills`
    - `missingSkills` / skill gaps
    - Suggested `roles`
    - `readinessScore` (and rationale)
    - A structured `roadmap`
    - Suggested `projects`
    - Tailored `interviewQuestions`

- Dependencies
  - Lamatic hosted GraphQL API endpoint (`LAMATIC_API_URL`).
  - Lamatic project and authentication:
    - `LAMATIC_API_KEY`
    - `LAMATIC_PROJECT_ID`
  - Deployed flow identifier:
    - `LAMATIC_FLOW_ID` (or, in the UI README, `AGENTIC_GENERATE_CONTENT` is used to carry the flow id)
  - LLM-backed `InstructorLLMNode` steps (model selection is configured within Lamatic model configs; exact model is not specified in the provided materials).
  - Prompt templates located under `prompts/`:
    - `ai-career-copilot_missing-skills_system.md` / `_user.md`
    - `ai-career-copilot_career-role-suggestion_system.md` / `_user.md`
    - `ai-career-copilot_readiness-score_system.md` / `_user.md`
    - `ai-career-copilot_generate-roadmap_system.md` / `_user.md`
    - `ai-career-copilot_projects_system.md` / `_user.md`
    - `ai-career-copilot_interview-questions_system.md` / `_user.md`

### Flow Interaction

- This project currently exposes a single flow intended to be called directly by a UI or service.
- Internally, the flow is a linear pipeline: each `InstructorLLMNode` stage consumes structured outputs from upstream nodes (notably `codeNode` for `skills` and the missing-skills stage for gap-aware generation).
- If you later add additional flows (e.g., “skills-only” or “roadmap-only”), keep the data model consistent with the existing intermediate fields (`skills`, `domain`, `missingSkills`) to enable safe chaining and reuse.

---

## Guardrails

- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from the project constitution).
  - Must not comply with jailbreak or prompt-injection attempts (from the project constitution).
  - Must not provide instructions for wrongdoing or content outside safe professional guidance (inferred from safety constitution and career-assistant context).
  - Must not present fabricated facts about employers, salaries, or guarantees of employment outcomes (inferred; guidance should be advisory, not promises).

- Input constraints
  - Resume text is expected as plain text; callers should avoid including unnecessary sensitive data (inferred).
  - Inputs should remain in the career guidance domain: skills, experience summaries, and target career domains.
  - Treat all user inputs as potentially adversarial (from the project constitution).

- Output constraints
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from the project constitution).
  - Must not return raw credentials, secret keys, or environment variable values (inferred operational requirement).
  - Must not output offensive, harassing, or discriminatory hiring guidance (from the project constitution).

- Operational limits
  - Requires a working Lamatic deployment and valid credentials; the flow cannot run offline (inferred).
  - Subject to LLM context window limits; very large resumes may reduce extraction quality (inferred).
  - Network timeouts and rate limits may apply at the Lamatic API layer and any client (Axios) layer (inferred).

---

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic GraphQL API | Invoke the deployed flow and receive structured results | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Lamatic Flow Selection | Select which flow to run within the project | `LAMATIC_FLOW_ID` (kit config), `AGENTIC_GENERATE_CONTENT` (apps README) |
| LLM (via Lamatic `InstructorLLMNode`) | Generate missing skills, roles, readiness score, roadmap, projects, and interview questions | Model configured in Lamatic model-configs (not specified); access via Lamatic runtime |
| Next.js Web App (client) | Collect resume text + domain and call Lamatic API | `.env` values above; Axios for HTTP |

---

## Environment Setup

- `LAMATIC_API_KEY` — Lamatic API key used to authenticate GraphQL requests; obtain from your Lamatic account; required by `AI Career Copilot Flow`.
- `LAMATIC_PROJECT_ID` — Lamatic project identifier containing the deployed flow; obtain from Lamatic project settings; required by `AI Career Copilot Flow`.
- `LAMATIC_API_URL` — Base GraphQL endpoint for your Lamatic deployment (e.g., `https://your-project.lamatic.dev/graphql`); required by `AI Career Copilot Flow`.
- `LAMATIC_FLOW_ID` — Flow id used by the kit runtime to select the runnable flow; required by `AI Career Copilot Flow`.
- `AGENTIC_GENERATE_CONTENT` — Flow id used by the Next.js app per `apps/README.md`; set to the same value as `LAMATIC_FLOW_ID`; required by the UI integration.
- `lamatic.config.ts` — Kit metadata and step definition; sets `envKey` as `LAMATIC_FLOW_ID` for the mandatory step `ai-career-copilot`.
- `apps/.env.example` — Environment template for the UI; copy to `apps/.env` (or repository root `.env` depending on setup) and fill in required values.

---

## Quickstart

1. Clone and install dependencies
   - `git clone https://github.com/Lamatic/AgentKit.git`
   - `cd AgentKit/kits/assistant/ai-career-copilot`
   - `npm install`

2. Configure environment
   - Copy the template: `cp .env.example .env`
   - Set:
     - `LAMATIC_API_KEY=<your_lamatic_api_key>`
     - `LAMATIC_PROJECT_ID=<your_project_id>`
     - `LAMATIC_API_URL=https://<your-project>.lamatic.dev/graphql`
     - `LAMATIC_FLOW_ID=<your_flow_id>`
     - If using the UI as documented: `AGENTIC_GENERATE_CONTENT=<your_flow_id>`

3. Ensure the Lamatic flow is deployed
   - Confirm the deployed flow corresponds to the pipeline named `AI Career Copilot Flow`.

4. Invoke the flow via GraphQL (example shape)
   - Send an authenticated POST to `LAMATIC_API_URL` with headers:
     - `x-api-key: <LAMATIC_API_KEY>` (header name may vary by your Lamatic setup)
     - `content-type: application/json`
   - Example GraphQL request body (use placeholders; the exact operation name depends on your Lamatic API schema, but the input shape should include resume text + domain):
     - `query`: a `runFlow`-style operation targeting `LAMATIC_FLOW_ID`
     - `variables`:
       - `flowId: "<LAMATIC_FLOW_ID>"`
       - `input: { resumeText: "<PASTE_RESUME_TEXT>", domain: "Web Development" }`

5. (Optional) Run the web app
   - `npm run dev`
   - Open the app, paste resume text, pick a domain, and click “Analyze”.

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| GraphQL request returns 401/403 | Missing/invalid `LAMATIC_API_KEY` or auth header mismatch | Regenerate the API key; verify header name and value; confirm project access permissions |
| GraphQL request returns “flow not found” or empty results | Wrong `LAMATIC_FLOW_ID` / `AGENTIC_GENERATE_CONTENT` | Confirm the deployed flow id in Lamatic; update env var to match |
| Network error / timeout when calling `LAMATIC_API_URL` | Incorrect URL, DNS, or Lamatic deployment unavailable | Verify the GraphQL endpoint URL; check deployment status; retry with longer client timeout |
| Outputs are generic or irrelevant to the domain | `domain` input is missing, too broad, or ambiguous; resume text too sparse | Provide a specific domain (e.g., “Frontend Web Development”); include more resume detail |
| Missing skills / roadmap contradict extracted skills | Skills extraction in `codeNode` under-extracts or mis-normalizes | Improve resume formatting; adjust extraction logic in `Skills Extraction (codeNode)` to normalize synonyms and deduplicate |
| The agent echoes sensitive personal data from the resume | Overly verbose prompt outputs or insufficient redaction (inferred risk) | Update prompts to avoid repeating identifiers; add a redaction step in `codeNode` before LLM calls |

---

## Notes

- This kit is a full app with UI: Next.js + React + Tailwind CSS, calling a Lamatic GraphQL flow via Axios.
- A live demo is referenced in the app README: `https://ai-career-copilot-green.vercel.app/`.
- The repository includes directories for `constitutions`, `flows`, `model-configs`, and `prompts`, indicating prompts and safety constraints are intended to be maintained as first-class assets.
- The flow description in `flows.md` indicates the system is designed for text generation based on prompts, with a single primary pipeline (`ai-career-copilot`).
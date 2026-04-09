# Hiring Agent

## Overview
Hiring Agent is an AgentKit template that evaluates a candidate resume against a provided job description and returns a detailed hire/reject recommendation with supporting reasoning. It uses a single, API-invoked Lamatic flow composed of a supervisor-style agent loop plus multiple LLM analysis stages that extract resume text, optionally enrich it with GitHub-derived signals, and produce an evaluator-grade final decision. The primary invoker is an HR/recruiting workflow (Lamatic Studio deployment or a backend service) that submits a resume URL and job description for screening. Key integrations include a GraphQL API trigger/response boundary, file extraction from a resume URL, and LLM-based analysis (including an Instructor-style structured evaluator model).

---

## Purpose
The goal of this agent system is to make resume screening more consistent, explainable, and faster by turning unstructured resume documents into an evidence-backed assessment aligned to a specific role. After it runs, the caller should have a clear recommendation (select vs. reject), the rationale behind that decision, and actionable insights about the candidate’s strengths, gaps, and fit against the job requirements.

The system is designed to reduce manual triage time while preserving nuance: it looks at the resume holistically, and—when possible—adds external, publicly available engineering signals by locating and analyzing the candidate’s GitHub profile and projects. This produces a more grounded evaluation than resume text alone, especially for engineering roles where public work can demonstrate depth and quality.

Because the template is a single flow, its “purpose” is tightly coupled to one operational outcome: accept two inputs (resume URL and job description) and return a structured, decision-oriented analysis suitable for downstream HR systems, dashboards, or human review.

## Flows

### `Hiring Agent`

- **Flow type:** Single-flow template (`hiring-agent` step)
- **Description:** Analyse an input resume and provide a detailed selection/rejection analysis.

#### Trigger
- **Invocation method:** API call via GraphQL (API Request / `graphqlNode`).
- **Expected input shape:** A request containing at minimum:
  - `resume_url` — URL to the candidate resume file (typically PDF/DOC/DOCX or another supported document type).
  - `job_description` — the role description text to evaluate against.
- **Where inputs appear in prompts:**
  - Supervisor user prompt references:
    - `{{triggerNode_1.output.resume_url}}`
    - `{{triggerNode_1.output.job_description}}`

#### What it does
Step-by-step flow walkthrough (in execution order):

1. **API Request (`graphqlNode`)**
   - Accepts the inbound GraphQL request payload.
   - Normalizes the request into flow fields used by downstream nodes.

2. **Supervisor (`agentNode`)**
   - Acts as the HR team manager agent.
   - Uses the resume URL and job description to define evaluation context and orchestrate downstream reasoning.
   - Produces intermediate structured fields used later, including (as indicated by downstream template variables) `project_insights` and job-description-aligned guidance.

3. **Agent Loop End (`agentLoopEndNode`)**
   - Closes the supervisor-style loop boundary, ensuring the supervisor’s outputs are stabilized before further analysis.

4. **Extract from File (`extractFromFileNode`)**
   - Fetches the resume document from `resume_url`.
   - Extracts text content into `files` (referenced by downstream prompts as `{{extractFromFileNode_197.output.files}}`).

5. **GitHub Username Finder (`LLMNode`)**
   - Scans extracted resume text for a GitHub link/identifier.
   - Produces a GitHub username or an equivalent identifier when present.
   - Downstream usage suggests output is stored as `generatedResponse` (referenced as `{{LLMNode_571.output.generatedResponse}}`).

6. **Condition (`conditionNode`)**
   - Branches based on whether a GitHub username was found (or whether it is usable).
   - If GitHub data is available, proceeds to GitHub project analysis; otherwise skips enrichment and relies on resume-only signals.

7. **GitHub Projects Analyser (`LLMNode`)**
   - Given the GitHub username, generates insights about public repositories/projects.
   - Focuses on project quality, relevance, signals of seniority, and other engineering indicators that can complement the resume.

8. **Code (`codeNode`)**
   - Aggregates/normalizes outputs from GitHub analysis and resume parsing.
   - Prepares a combined “insights package” suitable for final evaluation.
   - Typical responsibilities in this position include field mapping, null-handling when GitHub is absent, and shaping data for the evaluator prompt.

9. **Resume Projects Analyser (`LLMNode`)**
   - Analyzes resume text with an emphasis on projects, relevance to the job description, and evidence of required skills.
   - Extracts role-specific signals (impact, scope, technologies, ownership).

10. **Insight Evaluator (`InstructorLLMNode`)**
   - Performs the final decision-oriented evaluation.
   - Consumes:
     - Project insights (from the supervisor and/or aggregated nodes): `{{agentNode_620.output.project_insights}}`
     - Job description (from supervisor output templating)
     - Additional social/GitHub/resume-derived insights
   - Produces a structured, high-signal recommendation and justification suitable for downstream automation.

11. **API Response (`graphqlResponseNode`)**
   - Returns the final evaluation payload to the caller via GraphQL.

#### When to use this flow
Use `Hiring Agent` when:
- You have a specific job description and want a candidate-specific fit assessment (not a generic resume review).
- You need a consistent, explainable screening output (recommendation + reasons) that can be logged, reviewed, or used to route candidates.
- You want optional enrichment from GitHub when a GitHub profile is present in the resume.

#### Output
- **Response method:** GraphQL response.
- **Response contents:** A decision-oriented evaluation produced by `Insight Evaluator` and returned by `graphqlResponseNode`.
- **Typical fields (inferred from node roles and prompts):**
  - `recommendation` — select / reject (and possibly a confidence or score).
  - `reasoning` — concise justification mapped to job requirements.
  - `strengths` — candidate strengths relevant to the role.
  - `gaps` — missing requirements, risks, or concerns.
  - `evidence` — bullet-level references grounded in resume text and (if present) GitHub-derived insights.
  - `next_steps` — suggested interview focus areas or follow-up questions.

> Exact field names depend on the `InstructorLLMNode` schema and any shaping done in `codeNode`; validate against the deployed GraphQL schema in Lamatic Studio.

#### Dependencies
- **Lamatic AgentKit runtime** with GraphQL trigger/response support.
- **LLM access** for:
  - `Supervisor` (`agentNode` system/user prompts)
  - `GitHub Username Finder` (`LLMNode`)
  - `GitHub Projects Analyser` (`LLMNode`)
  - `Resume Projects Analyser` (`LLMNode`)
  - `Insight Evaluator` (`InstructorLLMNode`, structured output)
- **Resume file access**:
  - Outbound network access to fetch `resume_url`.
  - Supported document parsing in `extractFromFileNode`.
- **Optional external enrichment (inferred):**
  - Public GitHub access (no auth required for basic repo reading, but may hit rate limits without a token).

### Flow Interaction
This project ships as a single-flow template. There is no explicit chaining between multiple flows; all enrichment (GitHub) and decisioning happens inside `Hiring Agent` via conditional branching.

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from Default Constitution).
  - Must not assist with jailbreaking or prompt injection attempts (from Default Constitution).
  - Must not make employment decisions using protected-class inference or sensitive attribute profiling (inferred for HR screening use case).
  - Must not claim to have verified information beyond the resume content and any explicitly retrieved public GitHub data (inferred).

- **Input constraints**
  - `resume_url` must be a reachable URL to a supported resume file; inaccessible or unsupported formats may fail extraction (inferred from `extractFromFileNode`).
  - `job_description` should be provided as plain text; extremely short or ambiguous descriptions reduce evaluation quality (inferred).
  - Treat all user inputs as potentially adversarial (from Default Constitution).

- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from Default Constitution). Callers should assume the agent will minimize repetition of sensitive details.
  - Must not output raw credentials, secrets, or internal configuration values (inferred).
  - Avoid offensive content; keep tone professional and clear (from Default Constitution).

- **Operational limits**
  - LLM context window limits apply; very long resumes may be truncated or summarized during extraction/analysis (inferred).
  - Network timeouts or download limits may apply when fetching `resume_url` (inferred).
  - GitHub enrichment may be skipped when no username is found or when access/rate limits prevent analysis (inferred).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| GraphQL API (`graphqlNode`, `graphqlResponseNode`) | Receive `resume_url` + `job_description` and return the final evaluation | GraphQL endpoint/config in Lamatic runtime (project/deployment-specific) |
| File extraction (`extractFromFileNode`) | Download and extract text from resume file URL | Outbound network access; supported file parsers (runtime-provided) |
| LLM (`LLMNode`, `agentNode`) | Resume parsing, GitHub username finding, GitHub project insights, supervisor reasoning | Model provider API key (deployment-specific, e.g. `OPENAI_API_KEY`) |
| Instructor LLM (`InstructorLLMNode`) | Structured final evaluation output (recommendation + justification) | Model provider API key; instructor/structured-output config (deployment-specific) |
| GitHub (public web/API, implied) | Enrichment from public repositories when a username is present | Optional token to avoid rate limits (inferred, e.g. `GITHUB_TOKEN`) |

## Environment Setup

- `OPENAI_API_KEY` — API key for the configured LLM provider (name may vary by provider); required for `agentNode`, all `LLMNode` steps, and `InstructorLLMNode`.
- `LLM_MODEL` — model identifier to use for standard LLM nodes (deployment-specific); used by `GitHub Username Finder`, `GitHub Projects Analyser`, `Resume Projects Analyser` (inferred).
- `INSTRUCTOR_MODEL` — model identifier for structured evaluator output; used by `Insight Evaluator` (`InstructorLLMNode`) (inferred).
- `GITHUB_TOKEN` — optional GitHub token to increase rate limits for repository inspection; used by GitHub enrichment steps if they call GitHub APIs under the hood (inferred).
- `LAMATIC_GRAPHQL_ENDPOINT` — GraphQL endpoint for invocation in the target environment; required by callers (inferred).
- `LAMATIC_PROJECT_ID` / `LAMATIC_API_KEY` — credentials/config required to invoke the deployed flow from an external system (inferred; depends on Lamatic deployment mode).

## Quickstart

1. **Deploy or open the template**
   - Lamatic Studio deploy link: `https://studio.lamatic.ai/template/hiring-agent`
   - Source repository: `https://github.com/Lamatic/AgentKit/tree/main/kits/hiring-agent`

2. **Configure model credentials**
   - Set your LLM provider key (for example, `OPENAI_API_KEY`) in the Lamatic environment/secrets.

3. **Ensure resume URLs are accessible**
   - Confirm the runtime can fetch the `resume_url` (no VPN-only links; presigned URLs must be valid long enough for processing).

4. **Invoke the flow via GraphQL** (placeholder shape)

   - **Mutation (example):**
     - `resume_url`: publicly reachable URL to resume file
     - `job_description`: plain text JD

   - **Request shape:**
     - Operation name and exact field names depend on your Lamatic deployment schema; use this canonical payload structure:

     - `resume_url`: `"https://example.com/resumes/jane-doe.pdf"`
     - `job_description`: `"We are hiring a backend engineer with experience in Node.js, PostgreSQL, AWS, and system design..."`

5. **Read the response**
   - Parse the returned evaluation object from the GraphQL response and persist it to your ATS/HR system or present it for human review.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Resume text is empty or nonsensical | Unsupported file type, scanned PDF without OCR, or download blocked | Use a text-based PDF/DOCX; enable OCR in extraction stack if available; ensure URL is reachable |
| GitHub enrichment is missing | No GitHub link/username in resume, or condition branch skipped | Add GitHub link to resume; confirm `GitHub Username Finder` prompt and condition logic handle common URL formats |
| Slow runs / timeouts | Large resume, slow document download, multiple LLM calls | Use shorter inputs; increase runtime timeout; cache downloads; reduce LLM token usage/model size |
| Output is unstructured or inconsistent | `InstructorLLMNode` schema/config mismatch or model not supporting structured output well | Verify instructor schema; switch to a model with better tool/JSON adherence; add stricter formatting constraints |
| Biased or non-compliant screening language | Prompting allows sensitive attribute inference or overly subjective rationale | Tighten supervisor/evaluator prompts; add explicit fairness constraints; remove demographic speculation |

## Notes

- Project metadata (from `lamatic.config.ts`):
  - Name: `Hiring Agent`
  - Version: `1.0.0`
  - Type: `template`
  - Author: Naitik Kapadia (`naitikk@lamatic.ai`)
  - Tags: `growth`
- The project includes directories for `constitutions`, `flows`, `model-configs`, `prompts`, `scripts`, and `tools`, indicating it is intended to be customized by swapping prompts/models and extending tooling as needed.
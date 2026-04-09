# first_flow
A structured candidate-evaluation flow that screens a single candidate against a job description and returns a score, verdict, and reasoning as the core execution path of the Hiring Copilot Agent.

## Purpose
This flow is responsible for the end-to-end screening task in the Hiring Copilot Agent kit. It takes a job description together with a candidate profile payload, extracts the hiring requirements from the job description, evaluates how well the candidate matches those requirements, computes a structured score, and then generates a final natural-language rationale. Its job is to replace a manual first-pass recruiter review with a repeatable, machine-readable evaluation pipeline.

The outcome is a compact but useful hiring assessment: candidate identity details, a numeric evaluation, a verdict, a score breakdown, and a reasoning narrative. That output matters because it gives the UI or any invoking backend both structured data for ranking and display, and human-readable explanation for recruiter trust. The structured stages also reduce ambiguity between extraction, matching, and scoring.

Within the broader agent pipeline, this is the primary entry-point flow rather than a downstream helper. In the kit-level chain, it covers the full sequence of requirement extraction, candidate matching, score synthesis, and recommendation generation. In other words, it bundles the equivalent of analyze-match-score-explain into one callable Lamatic flow, making it suitable both for direct UI invocation and for reuse by orchestration systems that need a single screening primitive.

## When To Use
- Use when a recruiter, hiring manager, or UI needs to evaluate one candidate against one specific job description.
- Use when you already have candidate information in structured form, including `name`, `skills`, `experience_years`, `education`, `projects`, and optionally `certificates`.
- Use when you need a machine-readable screening result with explicit numeric fields such as `final_score`, `skill_match`, `experience_match`, and `project_relevance`.
- Use when you want a final recommendation plus supporting reasoning in one request rather than orchestrating multiple smaller flows.
- Use when the frontend or backend is calling a Lamatic GraphQL-triggered flow to power resume screening or shortlist decisions.
- Use when consistency matters more than freeform analysis, because most stages enforce structured JSON output schemas.

## When Not To Use
- Do not use when the job description is missing or empty, because the flow's first analysis stage depends on `job_description`.
- Do not use when the candidate payload is unstructured raw resume text only; this flow expects already extracted candidate fields rather than performing document parsing itself.
- Do not use when required model credentials or Lamatic deployment settings have not been configured.
- Do not use when you need batch or concurrent evaluation of many candidates in one call; this flow is designed around a single candidate screening path.
- Do not use when you need ATS synchronization, interview question generation, or other downstream recruiting actions not represented in this flow.
- Do not use when another system is responsible for resume ingestion or OCR and that preprocessing has not yet happened.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `job_description` | `string` | Yes | The target role description that the flow analyzes to extract required skills, tools, and experience expectations. |
| `name` | `string` | Yes | Candidate name echoed back in the response under `candidate.name`. |
| `certificates` | `string[]` | Yes | Candidate certifications or certificates. Present in the trigger schema even though they are not explicitly mapped into the final response. |
| `education` | `string` | Yes | Candidate education summary used as part of the candidate context available to model stages. |
| `experience_years` | `int` | Yes | Candidate years of experience, echoed back in the response under `candidate.experience`. |
| `projects` | `string[]` | Yes | Candidate project history used by the matching stage to assess relevance. |
| `skills` | `string[]` | Yes | Candidate skills list, echoed back in the response under `candidate.skills` and used for matching. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The trigger schema marks all listed fields as part of the expected request shape, so callers should treat them as required even where the business logic could theoretically proceed with partial data. `experience_years` should be a numeric integer, not a freeform string such as "five years". `skills`, `projects`, and `certificates` are expected as arrays of strings. The flow appears designed for English-language hiring inputs, and no explicit multilingual handling or length controls are encoded in the flow definition.

## Outputs
| Field | Type | Description |
|---|---|---|
| `candidate` | `object` | Echoed candidate summary combining selected trigger inputs. |
| `candidate.name` | `string` | Candidate name from `triggerNode_1.output.name`. |
| `candidate.skills` | `string[]` | Candidate skills from `triggerNode_1.output.skills`. |
| `candidate.experience` | `int` | Candidate years of experience from `triggerNode_1.output.experience_years`. |
| `evaluation` | `object` | Structured hiring evaluation built from scoring and matching outputs. |
| `evaluation.final_score` | `number` | Final aggregate score produced by `Scoring Agent`. |
| `evaluation.verdict` | `string` | Final recommendation or decision label produced by `Scoring Agent`. |
| `evaluation.breakdown` | `object` | Score components derived from `Matching Agent`. |
| `evaluation.breakdown.skill_match` | `number` | Skill match score from `Matching Agent`, intended on a `0-100` scale. |
| `evaluation.breakdown.experience_match` | `number` | Experience match score from `Matching Agent`, intended on a `0-100` scale. |
| `evaluation.breakdown.project_relevance` | `number` | Project relevance score from `Matching Agent`, intended on a `0-100` scale. |
| `reasoning` | `string` | Freeform explanatory text generated by `Reasoning Agent`. |

The response is a structured JSON object with three top-level sections: `candidate`, `evaluation`, and `reasoning`. Most of the payload is strongly structured and suitable for UI rendering, filtering, or ranking, while `reasoning` is a plain-language narrative. The flow does not expose the intermediate job-description analysis directly in the API response, so downstream consumers receive the final assessment rather than the full extraction trace.

## Dependencies
### Upstream Flows
This is the primary entry-point flow for the kit and does not require another Lamatic flow to run before it. In broader system terms, it assumes an upstream application step has already collected or extracted structured candidate data and a job description before invocation.

### Downstream Flows
No downstream Lamatic flows are identified in the provided kit context. This flow is typically consumed directly by the web UI or an external backend, which uses `evaluation.final_score`, `evaluation.verdict`, `evaluation.breakdown`, and `reasoning` for recruiter-facing display or further application logic.

### External Services
- Lamatic GraphQL trigger/runtime — receives the request, orchestrates node execution, and returns the API response — requires deployed Lamatic flow access via `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the calling application context
- Configured text-generation LLM for `JD Analyzer Agent` — extracts structured hiring requirements from the job description — requires provider credentials defined in the selected Lamatic model configuration
- Configured text-generation LLM for `Matching Agent` — scores candidate-to-requirement alignment into structured numeric fields — requires provider credentials defined in the selected Lamatic model configuration
- Configured text-generation LLM for `Scoring Agent` — produces final score, verdict, and breakdown object — requires provider credentials defined in the selected Lamatic model configuration
- Configured chat/text LLM for `Reasoning Agent` — generates the final explanatory narrative — requires provider credentials defined in the selected Lamatic model configuration
- LLM provider used by the kit, documented as OpenAI in the README — underpins model execution for the flow — requires `OPENAI_API_KEY`

### Environment Variables
- `OPENAI_API_KEY` — credential for the configured LLM provider used by the model-backed nodes — used by `JD Analyzer Agent`, `Matching Agent`, `Scoring Agent`, and `Reasoning Agent` through their Lamatic model configurations
- `LAMATIC_API_URL` — Lamatic API base URL used by the invoking application to call the deployed flow — used outside the internal nodes but required to reach `Initial Request`
- `LAMATIC_PROJECT_ID` — Lamatic project identifier used by the invoking application — used outside the internal nodes but required to invoke this flow deployment
- `LAMATIC_API_KEY` — Lamatic API credential used by the invoking application — used outside the internal nodes but required to invoke this flow deployment
- `AGENTIC_GENERATE_CONTENT` — README-documented environment variable holding the deployed flow ID for the app integration — used by the invoking application to target this flow

## Node Walkthrough
1. `Initial Request` (`graphqlNode`)
   - This is the flow trigger. It accepts a realtime GraphQL request containing `job_description`, `name`, `certificates`, `education`, `experience_years`, `projects`, and `skills`. It establishes the working context for the rest of the pipeline and exposes those fields as `triggerNode_1.output.*` for downstream nodes and final response mapping.

2. `JD Analyzer Agent` (`InstructorLLMNode`)
   - This node analyzes `job_description` and converts it into a structured requirements object. Its enforced schema includes `role`, `skills_required`, `experience_level`, `tools`, and `nice_to_have`. It uses the prompt reference `@prompts/first-flow_jd-analyzer-agent_user.md` and a dedicated model configuration, indicating this stage is optimized for extracting normalized hiring criteria rather than producing prose.

3. `Matching Agent` (`InstructorLLMNode`)
   - This node compares the candidate context from the trigger with the job-requirements structure produced by `JD Analyzer Agent`. Its output schema contains `skill_match`, `experience_match`, and `project_relevance`, each numeric and described as `0-100`. This stage is where the flow translates raw candidate facts into measurable fit signals.

4. `Scoring Agent` (`InstructorLLMNode`)
   - This node synthesizes the match results into a higher-level evaluation. It produces `final_score`, `verdict`, and a `breakdown` object that can carry the component scores. In practice, the final API response maps the detailed breakdown directly from `Matching Agent`, while this node contributes the aggregate score and recommendation label.

5. `Reasoning Agent` (`LLMNode`)
   - This node generates the final narrative explanation for the decision. Unlike the earlier instructor-style nodes, it is a standard `LLMNode` and returns freeform text in `generatedResponse`. It uses the prior scoring context to explain why the candidate received the computed outcome, giving recruiters a readable justification alongside the structured scores.

6. `API Response` (`graphqlResponseNode`)
   - This response node assembles the final JSON payload. It maps candidate identity fields from the trigger, the numeric evaluation from `Scoring Agent` and `Matching Agent`, and the explanatory `reasoning` text from `Reasoning Agent`. It returns the result as `application/json` with no retry behavior configured.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow invocation fails before model execution | Lamatic endpoint, project, or API key is missing or invalid | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the calling application and confirm the flow is deployed |
| Model-backed nodes return errors or do not start | LLM provider credential is missing or model configuration is incomplete | Confirm `OPENAI_API_KEY` and the provider credentials referenced by each node's `generativeModelName` configuration |
| Output contains weak or nonsensical scoring | `job_description` is empty, vague, or poorly formatted | Provide a clear job description with explicit role, responsibilities, and required skills |
| Matching scores are low or inconsistent despite a strong candidate | Candidate payload is incomplete, especially `skills`, `projects`, or `experience_years` | Ensure upstream resume extraction produced normalized structured fields before calling this flow |
| Trigger validation or runtime parsing fails | Arrays or numeric fields were sent in the wrong format, such as strings instead of `string[]` or `int` | Send `skills`, `projects`, and `certificates` as arrays and `experience_years` as an integer |
| `reasoning` is present but structured evaluation fields are missing | An upstream node in the chain produced malformed structured output or failed partial schema compliance | Inspect `Matching Agent` and `Scoring Agent` prompt/config behavior and tighten prompt instructions or fallback handling |
| No useful result for a candidate record | Upstream preprocessing step to extract structured resume data did not run or produced sparse fields | Run resume parsing or enrichment before invoking this screening flow |
| Final response omits JD analysis details | This flow does not expose `JD Analyzer Agent` output in `outputMapping` | If those details are needed, extend the response mapping to include selected JD-analysis fields |

## Notes
- The flow meta description is empty, so operational intent must be inferred from node names, schemas, and kit documentation.
- The response mapping uses `Matching Agent` for the published breakdown values even though `Scoring Agent` also emits a `breakdown` object. If you modify scoring logic, keep the response mapping aligned with the source of truth you want consumers to trust.
- The trigger schema is structured and does not include a raw `resume` field, even though the broader kit README describes resume upload. That implies resume parsing or text extraction occurs outside this flow.
- All model selector inputs are marked `isPrivate`, so model choice is intended to be configured internally rather than supplied by end users.
- No conditional branches, retries, fallback models, or tool calls are defined inside this flow; execution is a simple linear pipeline from trigger to response.
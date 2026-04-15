/*
 * # first_flow
 * A structured candidate-evaluation flow that screens a single candidate against a job description and returns a score, verdict, and reasoning as the core execution path of the Hiring Copilot Agent.
 *
 * ## Purpose
 * This flow is responsible for the end-to-end screening task in the Hiring Copilot Agent kit. It takes a job description together with a candidate profile payload, extracts the hiring requirements from the job description, evaluates how well the candidate matches those requirements, computes a structured score, and then generates a final natural-language rationale. Its job is to replace a manual first-pass recruiter review with a repeatable, machine-readable evaluation pipeline.
 *
 * The outcome is a compact but useful hiring assessment: candidate identity details, a numeric evaluation, a verdict, a score breakdown, and a reasoning narrative. That output matters because it gives the UI or any invoking backend both structured data for ranking and display, and human-readable explanation for recruiter trust. The structured stages also reduce ambiguity between extraction, matching, and scoring.
 *
 * Within the broader agent pipeline, this is the primary entry-point flow rather than a downstream helper. In the kit-level chain, it covers the full sequence of requirement extraction, candidate matching, score synthesis, and recommendation generation. In other words, it bundles the equivalent of analyze-match-score-explain into one callable Lamatic flow, making it suitable both for direct UI invocation and for reuse by orchestration systems that need a single screening primitive.
 *
 * ## When To Use
 * - Use when a recruiter, hiring manager, or UI needs to evaluate one candidate against one specific job description.
 * - Use when you already have candidate information in structured form, including `name`, `skills`, `experience_years`, `education`, `projects`, and optionally `certificates`.
 * - Use when you need a machine-readable screening result with explicit numeric fields such as `final_score`, `skill_match`, `experience_match`, and `project_relevance`.
 * - Use when you want a final recommendation plus supporting reasoning in one request rather than orchestrating multiple smaller flows.
 * - Use when the frontend or backend is calling a Lamatic GraphQL-triggered flow to power resume screening or shortlist decisions.
 * - Use when consistency matters more than freeform analysis, because most stages enforce structured JSON output schemas.
 *
 * ## When Not To Use
 * - Do not use when the job description is missing or empty, because the flow's first analysis stage depends on `job_description`.
 * - Do not use when the candidate payload is unstructured raw resume text only; this flow expects already extracted candidate fields rather than performing document parsing itself.
 * - Do not use when required model credentials or Lamatic deployment settings have not been configured.
 * - Do not use when you need batch or concurrent evaluation of many candidates in one call; this flow is designed around a single candidate screening path.
 * - Do not use when you need ATS synchronization, interview question generation, or other downstream recruiting actions not represented in this flow.
 * - Do not use when another system is responsible for resume ingestion or OCR and that preprocessing has not yet happened.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `job_description` | `string` | Yes | The target role description that the flow analyzes to extract required skills, tools, and experience expectations. |
 * | `name` | `string` | Yes | Candidate name echoed back in the response under `candidate.name`. |
 * | `certificates` | `string[]` | Yes | Candidate certifications or certificates. Present in the trigger schema even though they are not explicitly mapped into the final response. |
 * | `education` | `string` | Yes | Candidate education summary used as part of the candidate context available to model stages. |
 * | `experience_years` | `int` | Yes | Candidate years of experience, echoed back in the response under `candidate.experience`. |
 * | `projects` | `string[]` | Yes | Candidate project history used by the matching stage to assess relevance. |
 * | `skills` | `string[]` | Yes | Candidate skills list, echoed back in the response under `candidate.skills` and used for matching. |
 *
 * Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).
 *
 * The trigger schema marks all listed fields as part of the expected request shape, so callers should treat them as required even where the business logic could theoretically proceed with partial data. `experience_years` should be a numeric integer, not a freeform string such as "five years". `skills`, `projects`, and `certificates` are expected as arrays of strings. The flow appears designed for English-language hiring inputs, and no explicit multilingual handling or length controls are encoded in the flow definition.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `candidate` | `object` | Echoed candidate summary combining selected trigger inputs. |
 * | `candidate.name` | `string` | Candidate name from `triggerNode_1.output.name`. |
 * | `candidate.skills` | `string[]` | Candidate skills from `triggerNode_1.output.skills`. |
 * | `candidate.experience` | `int` | Candidate years of experience from `triggerNode_1.output.experience_years`. |
 * | `evaluation` | `object` | Structured hiring evaluation built from scoring and matching outputs. |
 * | `evaluation.final_score` | `number` | Final aggregate score produced by `Scoring Agent`. |
 * | `evaluation.verdict` | `string` | Final recommendation or decision label produced by `Scoring Agent`. |
 * | `evaluation.breakdown` | `object` | Score components derived from `Matching Agent`. |
 * | `evaluation.breakdown.skill_match` | `number` | Skill match score from `Matching Agent`, intended on a `0-100` scale. |
 * | `evaluation.breakdown.experience_match` | `number` | Experience match score from `Matching Agent`, intended on a `0-100` scale. |
 * | `evaluation.breakdown.project_relevance` | `number` | Project relevance score from `Matching Agent`, intended on a `0-100` scale. |
 * | `reasoning` | `string` | Freeform explanatory text generated by `Reasoning Agent`. |
 *
 * The response is a structured JSON object with three top-level sections: `candidate`, `evaluation`, and `reasoning`. Most of the payload is strongly structured and suitable for UI rendering, filtering, or ranking, while `reasoning` is a plain-language narrative. The flow does not expose the intermediate job-description analysis directly in the API response, so downstream consumers receive the final assessment rather than the full extraction trace.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is the primary entry-point flow for the kit and does not require another Lamatic flow to run before it. In broader system terms, it assumes an upstream application step has already collected or extracted structured candidate data and a job description before invocation.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are identified in the provided kit context. This flow is typically consumed directly by the web UI or an external backend, which uses `evaluation.final_score`, `evaluation.verdict`, `evaluation.breakdown`, and `reasoning` for recruiter-facing display or further application logic.
 *
 * ### External Services
 * - Lamatic GraphQL trigger/runtime — receives the request, orchestrates node execution, and returns the API response — requires deployed Lamatic flow access via `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the calling application context
 * - Configured text-generation LLM for `JD Analyzer Agent` — extracts structured hiring requirements from the job description — requires provider credentials defined in the selected Lamatic model configuration
 * - Configured text-generation LLM for `Matching Agent` — scores candidate-to-requirement alignment into structured numeric fields — requires provider credentials defined in the selected Lamatic model configuration
 * - Configured text-generation LLM for `Scoring Agent` — produces final score, verdict, and breakdown object — requires provider credentials defined in the selected Lamatic model configuration
 * - Configured chat/text LLM for `Reasoning Agent` — generates the final explanatory narrative — requires provider credentials defined in the selected Lamatic model configuration
 * - LLM provider used by the kit, documented as OpenAI in the README — underpins model execution for the flow — requires `OPENAI_API_KEY`
 *
 * ### Environment Variables
 * - `OPENAI_API_KEY` — credential for the configured LLM provider used by the model-backed nodes — used by `JD Analyzer Agent`, `Matching Agent`, `Scoring Agent`, and `Reasoning Agent` through their Lamatic model configurations
 * - `LAMATIC_API_URL` — Lamatic API base URL used by the invoking application to call the deployed flow — used outside the internal nodes but required to reach `Initial Request`
 * - `LAMATIC_PROJECT_ID` — Lamatic project identifier used by the invoking application — used outside the internal nodes but required to invoke this flow deployment
 * - `LAMATIC_API_KEY` — Lamatic API credential used by the invoking application — used outside the internal nodes but required to invoke this flow deployment
 * - `AGENTIC_GENERATE_CONTENT` — README-documented environment variable holding the deployed flow ID for the app integration — used by the invoking application to target this flow
 *
 * ## Node Walkthrough
 * 1. `Initial Request` (`graphqlNode`)
 *    - This is the flow trigger. It accepts a realtime GraphQL request containing `job_description`, `name`, `certificates`, `education`, `experience_years`, `projects`, and `skills`. It establishes the working context for the rest of the pipeline and exposes those fields as `triggerNode_1.output.*` for downstream nodes and final response mapping.
 *
 * 2. `JD Analyzer Agent` (`InstructorLLMNode`)
 *    - This node analyzes `job_description` and converts it into a structured requirements object. Its enforced schema includes `role`, `skills_required`, `experience_level`, `tools`, and `nice_to_have`. It uses the prompt reference `@prompts/first-flow_jd-analyzer-agent_user.md` and a dedicated model configuration, indicating this stage is optimized for extracting normalized hiring criteria rather than producing prose.
 *
 * 3. `Matching Agent` (`InstructorLLMNode`)
 *    - This node compares the candidate context from the trigger with the job-requirements structure produced by `JD Analyzer Agent`. Its output schema contains `skill_match`, `experience_match`, and `project_relevance`, each numeric and described as `0-100`. This stage is where the flow translates raw candidate facts into measurable fit signals.
 *
 * 4. `Scoring Agent` (`InstructorLLMNode`)
 *    - This node synthesizes the match results into a higher-level evaluation. It produces `final_score`, `verdict`, and a `breakdown` object that can carry the component scores. In practice, the final API response maps the detailed breakdown directly from `Matching Agent`, while this node contributes the aggregate score and recommendation label.
 *
 * 5. `Reasoning Agent` (`LLMNode`)
 *    - This node generates the final narrative explanation for the decision. Unlike the earlier instructor-style nodes, it is a standard `LLMNode` and returns freeform text in `generatedResponse`. It uses the prior scoring context to explain why the candidate received the computed outcome, giving recruiters a readable justification alongside the structured scores.
 *
 * 6. `API Response` (`graphqlResponseNode`)
 *    - This response node assembles the final JSON payload. It maps candidate identity fields from the trigger, the numeric evaluation from `Scoring Agent` and `Matching Agent`, and the explanatory `reasoning` text from `Reasoning Agent`. It returns the result as `application/json` with no retry behavior configured.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before model execution | Lamatic endpoint, project, or API key is missing or invalid | Verify `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in the calling application and confirm the flow is deployed |
 * | Model-backed nodes return errors or do not start | LLM provider credential is missing or model configuration is incomplete | Confirm `OPENAI_API_KEY` and the provider credentials referenced by each node's `generativeModelName` configuration |
 * | Output contains weak or nonsensical scoring | `job_description` is empty, vague, or poorly formatted | Provide a clear job description with explicit role, responsibilities, and required skills |
 * | Matching scores are low or inconsistent despite a strong candidate | Candidate payload is incomplete, especially `skills`, `projects`, or `experience_years` | Ensure upstream resume extraction produced normalized structured fields before calling this flow |
 * | Trigger validation or runtime parsing fails | Arrays or numeric fields were sent in the wrong format, such as strings instead of `string[]` or `int` | Send `skills`, `projects`, and `certificates` as arrays and `experience_years` as an integer |
 * | `reasoning` is present but structured evaluation fields are missing | An upstream node in the chain produced malformed structured output or failed partial schema compliance | Inspect `Matching Agent` and `Scoring Agent` prompt/config behavior and tighten prompt instructions or fallback handling |
 * | No useful result for a candidate record | Upstream preprocessing step to extract structured resume data did not run or produced sparse fields | Run resume parsing or enrichment before invoking this screening flow |
 * | Final response omits JD analysis details | This flow does not expose `JD Analyzer Agent` output in `outputMapping` | If those details are needed, extend the response mapping to include selected JD-analysis fields |
 *
 * ## Notes
 * - The flow meta description is empty, so operational intent must be inferred from node names, schemas, and kit documentation.
 * - The response mapping uses `Matching Agent` for the published breakdown values even though `Scoring Agent` also emits a `breakdown` object. If you modify scoring logic, keep the response mapping aligned with the source of truth you want consumers to trust.
 * - The trigger schema is structured and does not include a raw `resume` field, even though the broader kit README describes resume upload. That implies resume parsing or text extraction occurs outside this flow.
 * - All model selector inputs are marked `isPrivate`, so model choice is intended to be configured internally rather than supplied by end users.
 * - No conditional branches, retries, fallback models, or tool calls are defined inside this flow; execution is a simple linear pipeline from trigger to response.
 */

// Flow: first-flow

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "first_flow",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_277": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "InstructorLLMNode_582": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "InstructorLLMNode_264": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "LLMNode_982": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "first_flow_jd_analyzer_agent_user": "@prompts/first-flow_jd-analyzer-agent_user.md",
    "first_flow_matching_agent_user": "@prompts/first-flow_matching-agent_user.md",
    "first_flow_scoring_agent_user": "@prompts/first-flow_scoring-agent_user.md",
    "first_flow_reasoning_agent_user": "@prompts/first-flow_reasoning-agent_user.md"
  },
  "modelConfigs": {
    "first_flow_jd_analyzer_agent": "@model-configs/first-flow_jd-analyzer-agent.ts",
    "first_flow_matching_agent": "@model-configs/first-flow_matching-agent.ts",
    "first_flow_scoring_agent": "@model-configs/first-flow_scoring-agent.ts",
    "first_flow_reasoning_agent": "@model-configs/first-flow_reasoning-agent.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "Initial Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"job_description\": \"string\",\n  \"name\": \"string\",\n  \"certificates\": \"[string]\",\n  \"education\": \"string\",\n  \"experience_years\": \"int\",\n  \"projects\": \"[string]\",\n  \"skills\": \"[string]\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_277",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_277",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"role\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"skills_required\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"experience_level\": {\n      \"type\": \"number\"\n    },\n    \"tools\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"nice_to_have\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_jd-analyzer-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_jd-analyzer-agent.ts",
        "messages": "@model-configs/first-flow_jd-analyzer-agent.ts",
        "nodeName": "JD Analyzer Agent",
        "attachments": "@model-configs/first-flow_jd-analyzer-agent.ts",
        "generativeModelName": "@model-configs/first-flow_jd-analyzer-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": true
  },
  {
    "id": "InstructorLLMNode_582",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_582",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"skill_match\": {\n      \"type\": \"number\",\n      \"description\": \"0-100\"\n    },\n    \"experience_match\": {\n      \"type\": \"number\",\n      \"description\": \"0-100\"\n    },\n    \"project_relevance\": {\n      \"type\": \"number\",\n      \"description\": \"0-100\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_matching-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_matching-agent.ts",
        "messages": "@model-configs/first-flow_matching-agent.ts",
        "nodeName": "Matching Agent",
        "attachments": "@model-configs/first-flow_matching-agent.ts",
        "generativeModelName": "@model-configs/first-flow_matching-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_264",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_264",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"final_score\": {\n      \"type\": \"number\"\n    },\n    \"verdict\": {\n      \"type\": \"string\"\n    },\n    \"breakdown\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"skill_match\": {\n          \"type\": \"number\"\n        },\n        \"experience_match\": {\n          \"type\": \"number\"\n        },\n        \"project_relevance\": {\n          \"type\": \"number\"\n        }\n      },\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_scoring-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_scoring-agent.ts",
        "messages": "@model-configs/first-flow_scoring-agent.ts",
        "nodeName": "Scoring Agent",
        "attachments": "@model-configs/first-flow_scoring-agent.ts",
        "generativeModelName": "@model-configs/first-flow_scoring-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "LLMNode_982",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_982",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_reasoning-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_reasoning-agent.ts",
        "messages": "@model-configs/first-flow_reasoning-agent.ts",
        "nodeName": "Reasoning Agent",
        "attachments": "@model-configs/first-flow_reasoning-agent.ts",
        "credentials": "@model-configs/first-flow_reasoning-agent.ts",
        "generativeModelName": "@model-configs/first-flow_reasoning-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"candidate\": {\n    \"name\": \"{{triggerNode_1.output.name}}\",\n    \"skills\": \"{{triggerNode_1.output.skills}}\",\n    \"experience\": \"{{triggerNode_1.output.experience_years}}\"\n  },\n  \"evaluation\": {\n    \"final_score\": \"{{InstructorLLMNode_264.output.final_score}}\",\n    \"verdict\": \"{{InstructorLLMNode_264.output.verdict}}\",\n    \"breakdown\": {\n      \"skill_match\": \"{{InstructorLLMNode_582.output.skill_match}}\",\n      \"experience_match\": \"{{InstructorLLMNode_582.output.experience_match}}\",\n      \"project_relevance\": \"{{InstructorLLMNode_582.output.project_relevance}}\"\n    }\n  },\n  \"reasoning\": \"{{LLMNode_982.output.generatedResponse}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_277",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_277",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_582-InstructorLLMNode_264",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_582",
    "target": "InstructorLLMNode_264",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_264-LLMNode_982",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_264",
    "target": "LLMNode_982",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_982-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_982",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_277-InstructorLLMNode_582-455",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_277",
    "target": "InstructorLLMNode_582",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

/*
 * # AI Career Copilot Flow
 * A synchronous GraphQL flow that turns resume text and a target career domain into a structured career guidance package for the broader AI Career Copilot system.
 *
 * ## Purpose
 * This flow is responsible for the full analysis pass of the AI Career Copilot kit. It accepts a user's raw `resume_text` and chosen `domain`, extracts the skills present in the resume, identifies gaps against the target domain, suggests relevant roles, estimates readiness, and then generates a practical improvement plan in the form of a roadmap, project ideas, and interview questions.
 *
 * The outcome is a single structured response that gives the caller both diagnosis and next steps. That matters because the wider system is designed around one actionable analysis request rather than several disconnected tools. By returning current skills, missing skills, role options, readiness scoring, and preparation assets together, the flow reduces orchestration overhead for the UI and for any external service chaining this workflow.
 *
 * In the broader agent pipeline, this is the entry-point and primary execution flow rather than a mid-pipeline helper. As described in the parent `agent.md`, the system is implemented as a single sequential enrichment chain: skills extraction feeds gap analysis, which feeds role suggestion, then readiness scoring, roadmap generation, project ideation, and interview preparation. In plan-retrieve-synthesize terms, this flow performs intake, lightweight extraction, sequential LLM synthesis, and final packaging in one invocation.
 *
 * ## When To Use
 * - Use when a caller has raw resume content and wants end-to-end career guidance for a specific target `domain` in one request.
 * - Use when the product experience is an "Analyze" action that should return skills, role recommendations, readiness, roadmap, projects, and interview questions together.
 * - Use when a web UI, backend service, coaching assistant, or learning platform needs a single structured GraphQL response rather than separate specialist calls.
 * - Use when the user intent is to assess current fit for a career path such as web development, data science, product management, or another named domain.
 * - Use when downstream consumers need normalized `skills` extracted from free-text resume content before generating recommendations.
 *
 * ## When Not To Use
 * - Do not use when `resume_text` is missing, empty, or not actually resume-like content; the skills extraction stage depends on meaningful career/profile text.
 * - Do not use when `domain` is missing or too vague to support comparison, such as generic values like "tech" without a more specific target area.
 * - Do not use when the caller only needs one narrow function, such as standalone interview practice or isolated role brainstorming, unless this all-in-one response is still acceptable.
 * - Do not use when the input is a file upload, URL, or structured resume object that has not been converted into plain text expected by the trigger schema.
 * - Do not use when the Lamatic deployment, GraphQL endpoint, or model configuration credentials are not available; this flow is API- and model-dependent.
 * - Do not route to this flow as a downstream helper from another flow in this kit, because the parent agent defines this as the primary standalone flow rather than one stage among separately invokable sibling flows.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `resume_text` | `string` | Yes | Raw resume or profile text submitted by the caller for skill extraction and career analysis. |
 * | `domain` | `string` | Yes | The target career domain the user wants to evaluate against, such as web development or data science. |
 *
 * The trigger schema expects both fields as strings. `resume_text` should contain enough detail to infer technical or professional skills; extremely short or generic text will weaken all downstream outputs. `domain` should be a clear target specialization rather than an ambiguous broad category. The flow does not declare explicit length limits in the source, but practical execution quality depends on concise, relevant, plain-text input.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `skills` | `array` | Skills extracted from the input resume text by the code node. |
 * | `missing_skills` | `array` | Skills the model believes are missing or underrepresented for the chosen `domain`. |
 * | `roles` | `array` | Suggested career roles aligned with the extracted skills and target domain. |
 * | `readiness_score` | `number` | A numeric estimate of how prepared the user is for the target domain or related roles. |
 * | `roadmap` | `array` | Recommended step-by-step learning or improvement actions. |
 * | `projects` | `array` | Suggested portfolio or practice projects tailored to the user's path. |
 * | `interview_questions` | `array` | Tailored interview questions for preparation in the target area. |
 *
 * The API response is a single JSON object with a mix of arrays and one numeric field. Most outputs are lists of strings rather than rich nested structures. Completeness depends on the quality of `resume_text`, the specificity of `domain`, and the behavior of the configured LLMs. Because several stages are generated sequentially, weak upstream extraction can cascade into less precise downstream recommendations.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow and the primary invokable workflow for the `ai-career-copilot` agent.
 * - It does not require a prior Lamatic flow to run first; it accepts external input directly through its GraphQL trigger.
 *
 * ### Downstream Flows
 * - None within this kit. The parent `agent.md` describes the entire career-copilot pipeline as a single flow rather than several separately chained Lamatic flows.
 * - External consumers such as the Next.js UI or other backend services may consume the final response fields `skills`, `missing_skills`, `roles`, `readiness_score`, `roadmap`, `projects`, and `interview_questions` directly.
 *
 * ### External Services
 * - Lamatic GraphQL trigger/response runtime — receives the synchronous API request and returns the final JSON response — requires deployed Lamatic project access and authenticated API usage.
 * - Configured text-generation models via `InstructorLLMNode` — used for missing-skills analysis, role suggestion, readiness scoring, roadmap generation, project ideation, and interview question generation — requires a valid Lamatic model configuration for each `generativeModelName` input.
 * - Lamatic hosted script execution — runs the referenced skills extraction script `@scripts/ai-career-copilot_skills-extraction.ts` — requires the flow to be deployed in a Lamatic environment where referenced assets are available.
 *
 * ### Environment Variables
 * - `LAMATIC_API_KEY` — authenticates requests from external clients to the deployed Lamatic project — used by the caller that invokes the flow's GraphQL entry point, corresponding to the `API Request` trigger.
 * - `LAMATIC_PROJECT_ID` — identifies the Lamatic project hosting the flow — used by the caller when targeting the deployed flow endpoint for `API Request`.
 * - `LAMATIC_API_URL` — base URL for Lamatic API communication from the surrounding application — used by the external client that invokes `API Request`.
 * - `AGENTIC_GENERATE_CONTENT` — stores the deployed flow ID used by the application to invoke this flow — used by the external caller to route requests into `API Request`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - This is the GraphQL entry point for the flow.
 *    - It accepts a realtime request with two fields in the declared schema: `resume_text` and `domain`.
 *    - These values become the working context for the rest of the pipeline.
 *
 * 2. `Skills Extraction` (`codeNode`)
 *    - This node runs the referenced script `@scripts/ai-career-copilot_skills-extraction.ts`.
 *    - Its declared output schema contains `domain` as a `string` and `skills` as an `array`.
 *    - In practice, it parses the incoming `resume_text`, extracts a normalized list of skills, and passes through or reconstructs the chosen `domain` for downstream prompts.
 *    - This is the only non-LLM transformation stage and it establishes the structured inputs the rest of the flow builds on.
 *
 * 3. `Missing Skills` (`InstructorLLMNode`)
 *    - This node uses the prompts `@prompts/ai-career-copilot_missing-skills_system.md` and `@prompts/ai-career-copilot_missing-skills_user.md`.
 *    - It runs against the configured text model defined by `@model-configs/ai-career-copilot_missing-skills.ts`.
 *    - Using the extracted `skills` and target `domain`, it returns a structured object containing `missing_skills` as an array of strings.
 *    - This is the gap-analysis step that frames the rest of the recommendations.
 *
 * 4. `Career Role Suggestion` (`InstructorLLMNode`)
 *    - This node uses the role-suggestion prompt pair referenced at `@prompts/ai-career-copilot_career-role-suggestion_system.md` and `@prompts/ai-career-copilot_career-role-suggestion_user.md`.
 *    - It runs with the model configuration at `@model-configs/ai-career-copilot_career-role-suggestion.ts`.
 *    - Based on the resume-derived profile and prior analysis context, it produces `roles`, an array of suggested job targets.
 *    - This connects the user's current state to realistic career directions.
 *
 * 5. `Readiness Score` (`InstructorLLMNode`)
 *    - This node uses the readiness prompts referenced by `@prompts/ai-career-copilot_readiness-score_system.md` and `@prompts/ai-career-copilot_readiness-score_user.md`.
 *    - It runs with `@model-configs/ai-career-copilot_readiness-score.ts`.
 *    - It outputs a numeric `readiness_score`, representing the model's estimate of preparedness for the target domain or roles.
 *    - This gives the caller a compact summary signal that complements the detailed lists.
 *
 * 6. `Generate Roadmap` (`InstructorLLMNode`)
 *    - This node uses `@prompts/ai-career-copilot_generate-roadmap_system.md` and `@prompts/ai-career-copilot_generate-roadmap_user.md`.
 *    - It runs with `@model-configs/ai-career-copilot_generate-roadmap.ts`.
 *    - It produces `roadmap`, an array of recommended learning or improvement steps.
 *    - This turns the earlier diagnosis into a practical plan of action.
 *
 * 7. `Projects` (`InstructorLLMNode`)
 *    - This node uses `@prompts/ai-career-copilot_projects_system.md` and `@prompts/ai-career-copilot_projects_user.md`.
 *    - It runs with `@model-configs/ai-career-copilot_projects.ts`.
 *    - It outputs `projects`, an array of suggested portfolio or practice builds aligned with the user's target path.
 *    - This adds evidence-building recommendations that help close the identified skills gap.
 *
 * 8. `Interview Questions` (`InstructorLLMNode`)
 *    - This node uses `@prompts/ai-career-copilot_interview-questions_system.md` and `@prompts/ai-career-copilot_interview-questions_user.md`.
 *    - It runs with `@model-configs/ai-career-copilot_interview-questions.ts`.
 *    - It produces `questions`, an array of likely interview prompts tailored to the inferred career path.
 *    - These questions are later remapped in the response as `interview_questions`.
 *
 * 9. `API Response` (`responseNode`)
 *    - This node returns the final synchronous JSON response to the caller.
 *    - It maps outputs from prior nodes into the public response contract:
 *      - `skills` from `codeNode_872.output.skills`
 *      - `missing_skills` from `InstructorLLMNode_991.output.missing_skills`
 *      - `roles` from `InstructorLLMNode_559.output.roles`
 *      - `readiness_score` from `InstructorLLMNode_409.output.readiness_score`
 *      - `roadmap` from `InstructorLLMNode_134.output.roadmap`
 *      - `projects` from `InstructorLLMNode_248.output.projects`
 *      - `interview_questions` from `InstructorLLMNode_755.output.questions`
 *    - The response is returned with `content-type` set to `application/json`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request cannot authenticate or invoke the deployed flow | Missing or invalid `LAMATIC_API_KEY`, wrong `LAMATIC_PROJECT_ID`, incorrect `LAMATIC_API_URL`, or wrong flow id in `AGENTIC_GENERATE_CONTENT` | Verify deployment details and environment variables in the calling application, then retry against the correct Lamatic project and flow. |
 * | Flow returns poor or empty `skills` | `resume_text` is empty, too short, poorly formatted, or not resume-like enough for the extraction script | Provide richer plain-text resume content with explicit technologies, responsibilities, and experience details. |
 * | `missing_skills`, `roles`, `roadmap`, or `projects` feel generic | `domain` is vague or overly broad, causing prompts to reason against an unclear target | Supply a precise target domain such as `Frontend Web Development`, `Data Engineering`, or `DevOps` rather than a broad label like `IT`. |
 * | One or more LLM-generated fields are missing from the response | A model configuration is unset, the selected `generativeModelName` is invalid, or the model output failed schema conformance for that node | Check the configured model input for each `InstructorLLMNode`, validate the referenced model configs, and retest with a supported text-generation model. |
 * | Flow execution fails during an LLM stage | The Lamatic deployment cannot access the referenced prompt or model-config asset, or the model provider configuration is incomplete | Confirm that all referenced assets under `@prompts/` and `@model-configs/` are present in the deployed flow package and that model credentials are valid. |
 * | `interview_questions` is empty while earlier stages succeeded | The final `Interview Questions` node generated no conforming `questions` array or the model response was malformed | Review the interview-question prompt and schema, confirm model health, and retry with clearer domain and resume inputs. |
 * | Caller expects upstream flow outputs as inputs | A client is treating this as a downstream helper flow even though it is the system's entry point | Invoke this flow directly with raw `resume_text` and `domain`; do not wait for another Lamatic flow to populate prerequisites. |
 * | Response shape does not match client expectations | Client expects nested objects or prose blocks, but the flow returns mostly arrays plus one number | Update the client contract to use the documented response fields and types, or add a presentation layer that reformats the data. |
 *
 * ## Notes
 * - The flow description metadata is empty in `meta.description`, so the node graph and README are the authoritative source for behavior.
 * - All six `InstructorLLMNode` stages expose a private required model input named `generativeModelName`. In practice, each stage can be configured independently, even though the business workflow is linear.
 * - The execution graph is strictly sequential. Although some later outputs are conceptually independent, the current flow design does not parallelize them.
 * - The final public field `interview_questions` is a response mapping alias for the internal node output field `questions`.
 * - The flow is designed for synchronous, interactive use. If resume text is very large or model latency is high, the end-user experience may degrade because all stages run in a single request cycle.
 */

// Flow: ai-career-copilot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "AI Career Copilot Flow",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_991": [
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
  "InstructorLLMNode_559": [
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
  "InstructorLLMNode_409": [
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
  "InstructorLLMNode_134": [
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
  "InstructorLLMNode_248": [
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
  "InstructorLLMNode_755": [
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
    "ai_career_copilot_missing_skills_system": "@prompts/ai-career-copilot_missing-skills_system.md",
    "ai_career_copilot_missing_skills_user": "@prompts/ai-career-copilot_missing-skills_user.md",
    "ai_career_copilot_career_role_suggestion_system": "@prompts/ai-career-copilot_career-role-suggestion_system.md",
    "ai_career_copilot_career_role_suggestion_user": "@prompts/ai-career-copilot_career-role-suggestion_user.md",
    "ai_career_copilot_readiness_score_system": "@prompts/ai-career-copilot_readiness-score_system.md",
    "ai_career_copilot_readiness_score_user": "@prompts/ai-career-copilot_readiness-score_user.md",
    "ai_career_copilot_generate_roadmap_system": "@prompts/ai-career-copilot_generate-roadmap_system.md",
    "ai_career_copilot_generate_roadmap_user": "@prompts/ai-career-copilot_generate-roadmap_user.md",
    "ai_career_copilot_projects_system": "@prompts/ai-career-copilot_projects_system.md",
    "ai_career_copilot_projects_user": "@prompts/ai-career-copilot_projects_user.md",
    "ai_career_copilot_interview_questions_system": "@prompts/ai-career-copilot_interview-questions_system.md",
    "ai_career_copilot_interview_questions_user": "@prompts/ai-career-copilot_interview-questions_user.md"
  },
  "scripts": {
    "ai_career_copilot_skills_extraction": "@scripts/ai-career-copilot_skills-extraction.ts"
  },
  "modelConfigs": {
    "ai_career_copilot_missing_skills": "@model-configs/ai-career-copilot_missing-skills.ts",
    "ai_career_copilot_career_role_suggestion": "@model-configs/ai-career-copilot_career-role-suggestion.ts",
    "ai_career_copilot_readiness_score": "@model-configs/ai-career-copilot_readiness-score.ts",
    "ai_career_copilot_generate_roadmap": "@model-configs/ai-career-copilot_generate-roadmap.ts",
    "ai_career_copilot_projects": "@model-configs/ai-career-copilot_projects.ts",
    "ai_career_copilot_interview_questions": "@model-configs/ai-career-copilot_interview-questions.ts"
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
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"resume_text\": \"string\",\n  \"domain\": \"string\"\n}"
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
    "id": "codeNode_872",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "domain": "string",
        "skills": "array"
      },
      "values": {
        "id": "codeNode_872",
        "code": "@scripts/ai-career-copilot_skills-extraction.ts",
        "nodeName": "Skills Extraction"
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
    "selected": false
  },
  {
    "id": "InstructorLLMNode_991",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_991",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"missing_skills\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-career-copilot_missing-skills_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-career-copilot_missing-skills_user.md"
          }
        ],
        "memories": "@model-configs/ai-career-copilot_missing-skills.ts",
        "messages": "@model-configs/ai-career-copilot_missing-skills.ts",
        "nodeName": "Missing Skills",
        "attachments": "@model-configs/ai-career-copilot_missing-skills.ts",
        "generativeModelName": "@model-configs/ai-career-copilot_missing-skills.ts"
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
    "id": "InstructorLLMNode_559",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_559",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"roles\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-career-copilot_career-role-suggestion_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-career-copilot_career-role-suggestion_user.md"
          }
        ],
        "memories": "@model-configs/ai-career-copilot_career-role-suggestion.ts",
        "messages": "@model-configs/ai-career-copilot_career-role-suggestion.ts",
        "nodeName": "Career Role Suggestion",
        "attachments": "@model-configs/ai-career-copilot_career-role-suggestion.ts",
        "generativeModelName": "@model-configs/ai-career-copilot_career-role-suggestion.ts"
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
    "id": "InstructorLLMNode_409",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_409",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"readiness_score\": {\n      \"type\": \"number\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-career-copilot_readiness-score_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-career-copilot_readiness-score_user.md"
          }
        ],
        "memories": "@model-configs/ai-career-copilot_readiness-score.ts",
        "messages": "@model-configs/ai-career-copilot_readiness-score.ts",
        "nodeName": "Readiness Score",
        "attachments": "@model-configs/ai-career-copilot_readiness-score.ts",
        "generativeModelName": "@model-configs/ai-career-copilot_readiness-score.ts"
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
    "id": "InstructorLLMNode_134",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_134",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"roadmap\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-career-copilot_generate-roadmap_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-career-copilot_generate-roadmap_user.md"
          }
        ],
        "memories": "@model-configs/ai-career-copilot_generate-roadmap.ts",
        "messages": "@model-configs/ai-career-copilot_generate-roadmap.ts",
        "nodeName": "Generate Roadmap",
        "attachments": "@model-configs/ai-career-copilot_generate-roadmap.ts",
        "generativeModelName": "@model-configs/ai-career-copilot_generate-roadmap.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_248",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_248",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"projects\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-career-copilot_projects_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-career-copilot_projects_user.md"
          }
        ],
        "memories": "@model-configs/ai-career-copilot_projects.ts",
        "messages": "@model-configs/ai-career-copilot_projects.ts",
        "nodeName": "Projects",
        "attachments": "@model-configs/ai-career-copilot_projects.ts",
        "generativeModelName": "@model-configs/ai-career-copilot_projects.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_755",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_755",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"questions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-career-copilot_interview-questions_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-career-copilot_interview-questions_user.md"
          }
        ],
        "memories": "@model-configs/ai-career-copilot_interview-questions.ts",
        "messages": "@model-configs/ai-career-copilot_interview-questions.ts",
        "nodeName": "Interview Questions",
        "attachments": "@model-configs/ai-career-copilot_interview-questions.ts",
        "generativeModelName": "@model-configs/ai-career-copilot_interview-questions.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 910
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
        "outputMapping": "{\n  \"skills\": \"{{codeNode_872.output.skills}}\",\n  \"missing_skills\": \"{{InstructorLLMNode_991.output.missing_skills}}\",\n  \"roles\": \"{{InstructorLLMNode_559.output.roles}}\",\n  \"readiness_score\": \"{{InstructorLLMNode_409.output.readiness_score}}\",\n  \"roadmap\": \"{{InstructorLLMNode_134.output.roadmap}}\",\n  \"projects\": \"{{InstructorLLMNode_248.output.projects}}\",\n  \"interview_questions\": \"{{InstructorLLMNode_755.output.questions}}\"\n}"
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
      "y": 1040
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_872",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_872",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_872-InstructorLLMNode_991",
    "type": "defaultEdge",
    "source": "codeNode_872",
    "target": "InstructorLLMNode_991",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_991-InstructorLLMNode_559",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_991",
    "target": "InstructorLLMNode_559",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_559-InstructorLLMNode_409",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_559",
    "target": "InstructorLLMNode_409",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_409-InstructorLLMNode_134",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_409",
    "target": "InstructorLLMNode_134",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_134-InstructorLLMNode_248",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_134",
    "target": "InstructorLLMNode_248",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_248-InstructorLLMNode_755",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_248",
    "target": "InstructorLLMNode_755",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_755-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_755",
    "target": "responseNode_triggerNode_1",
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

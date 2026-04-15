/*
 * # Hiring Agent
 * Analyzes a candidate resume against a job description, optionally enriches the assessment with GitHub project signals, and returns the canonical hiring recommendation used by the wider screening pipeline.
 *
 * ## Purpose
 * This flow is responsible for converting two raw hiring inputs — a candidate `resume_url` and a target `job_description` — into a decision-oriented evaluation that can be used by recruiters, backend services, or orchestration layers. It solves the core screening problem: unstructured resume content is difficult to compare consistently against role requirements, and public engineering evidence such as GitHub work is often scattered or omitted from direct recruiter review. This flow centralizes that analysis into one API-invoked path.
 *
 * Its outcome is a detailed selection or rejection assessment backed by reasoning and a numeric score. That matters because the wider agent system is designed to support fast, explainable candidate triage rather than just generating a generic summary. The flow does not merely extract resume text; it attempts to identify a GitHub username, analyze public projects when available, fall back to resume-project analysis when GitHub evidence is unavailable, and then evaluate those insights against the role requirements. The returned result is the main artifact that downstream human or automated hiring processes act on.
 *
 * Within the broader system, this flow is effectively the entry-point and execution engine for the hiring agent template. In plan-retrieve-synthesize terms, the `Supervisor` agent plans which internal path to execute, the parser branch retrieves evidence from the resume and optionally GitHub, and the evaluator branch synthesizes that evidence into a structured score plus rationale. According to the parent agent context, external HR or recruiting workflows invoke this flow directly; it is not a mid-pipeline helper flow but the primary screening operation for the template.
 *
 * ## When To Use
 * - Use when you have a candidate resume accessible by URL and need a hire or reject recommendation for a specific role.
 * - Use when an HR or recruiting workflow needs a consistent, explainable screening result rather than an informal summary.
 * - Use when you want the system to inspect resume content and, if possible, enrich the evaluation with publicly visible GitHub project signals.
 * - Use when a backend service or Lamatic deployment needs a single API-call screening workflow that returns a final recommendation.
 * - Use when the candidate is being assessed for a role where project evidence, technical skills, and role-fit reasoning materially affect the decision.
 *
 * ## When Not To Use
 * - Do not use when no `resume_url` is available or the file cannot be fetched from a network-accessible location.
 * - Do not use when the job requirements are missing, because the evaluation logic depends on a concrete `job_description`.
 * - Do not use for general resume parsing, document conversion, or profile extraction if no hiring recommendation is needed.
 * - Do not use when you need deterministic compliance screening or policy enforcement rather than LLM-based judgment and reasoning.
 * - Do not use for non-resume documents unless you have verified the file extractor can successfully read the provided format.
 * - Do not use this flow as a downstream enrichment step after another hiring-evaluation flow; this flow is the primary entry-point for that responsibility.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `resume_url` | string | Yes | URL of the candidate resume file that the flow will fetch and extract content from. |
 * | `job_description` | string | Yes | Text of the role description used to evaluate candidate fit, score relevance, and generate final reasoning. |
 *
 * The trigger schema is not declared in `inputs`, but the runtime behavior clearly assumes both fields arrive in the API request payload and are referenced by the `Supervisor` agent. The `resume_url` must point to a reachable document, with the extraction node configured specifically for `pdf` input. The `job_description` is expected to be substantive natural-language role text rather than a short title alone. No explicit length limits are declared in the flow, but very long job descriptions may affect model context usage.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | string or object-like final response | Final response emitted by `agentLoopEndNode_558.output.finalResponse`, representing the flow's completed hiring analysis. |
 *
 * The API response contains a single top-level field, `output`, mapped directly from the supervisor loop's final response. In practice, the content of `output` depends on which branch completed the loop. The evaluator node is configured to produce a structured object containing `score` and `reasoning`, while the parser path feeds analyzed insights back into the supervisor loop through the `Code` node. As a result, callers should treat `output` as the canonical final decision payload from the agent loop rather than assuming a single flat prose string shape in every implementation context.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone, API-invoked entry-point flow for the hiring agent template.
 * - The only prerequisite is that the invoking system supplies valid `resume_url` and `job_description` values in the request.
 *
 * ### Downstream Flows
 * - No explicit downstream Lamatic flows are defined in this template.
 * - In the broader system context, the output is intended to be consumed by external HR tools, dashboards, case-management workflows, or human reviewers rather than another packaged flow.
 *
 * ### External Services
 * - GraphQL API boundary — receives the inbound request and returns the final response — credentialing depends on the deployment hosting the Lamatic API endpoint.
 * - Remote file hosting for the resume URL — provides the source resume document to extract — no explicit credential in the flow, but the file must be publicly reachable or otherwise accessible to the runtime.
 * - Configured LLM provider for `Github Username Finder` — used to infer a candidate GitHub handle from extracted resume text — credential is defined indirectly by the referenced model config.
 * - Configured LLM provider for `Github Projects Analyser` — used to analyze public GitHub project evidence — credential is defined indirectly by the referenced model config.
 * - GitHub access through tools referenced by `@tools/hiring-agent_github-projects-analyser_tools.ts` — used to fetch or inspect GitHub project data — required credential depends on the tool implementation.
 * - Configured LLM provider for `Resume Projects Analyser` — used when GitHub identification fails and only resume-described projects can be analyzed — credential is defined indirectly by the referenced model config.
 * - Configured LLM provider for `Insight Evaluator` — used to produce a structured numeric score and reasoning — credential is defined indirectly by the referenced model config.
 *
 * ### Environment Variables
 * - `LLM provider credentials as required by the referenced model configs` — authenticate the LLM calls used by `Github Username Finder`, `Github Projects Analyser`, `Resume Projects Analyser`, and `Insight Evaluator`.
 * - `GitHub API credentials if required by the GitHub analysis tools` — enable repository or profile access for `Github Projects Analyser`.
 * - `Any deployment-level GraphQL/API auth variables` — govern invocation and response delivery for `API Request` and `API Response`.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - This is the flow entry point. It receives the inbound API payload that contains the candidate `resume_url` and `job_description` and exposes those values to the rest of the flow.
 *
 * 2. `Supervisor` (`agentNode`)
 *    - This node acts as the orchestration brain for the flow. It runs a supervisor-style agent loop with up to `5` iterations and can route work to one of two named branches: `Parser` or `Evaluator`.
 *    - The `Parser` branch expects `resume_url` and `job_description` so it can gather evidence from the candidate materials.
 *    - The `Evaluator` branch expects `project_insights` and `job_description` so it can transform gathered evidence into a final hiring judgment.
 *    - The connected `Agent Loop End` node allows this supervisor to receive intermediate results and decide whether another branch should run or whether the final answer is ready.
 *
 * 3. `Extract from File` (`extractFromFileNode`)
 *    - When the supervisor selects the `Parser` path, this node fetches the file located at `{{agentNode_852.output.resume_url}}` and extracts text from it as a `pdf`.
 *    - It is configured to join pages, which helps produce a single textual representation of the resume for downstream LLM analysis.
 *
 * 4. `Github Username Finder` (`LLMNode`)
 *    - This model reads the extracted resume content and attempts to determine the candidate's GitHub username or profile identifier.
 *    - It uses dedicated system and user prompts plus a referenced model configuration. Its output determines whether the flow can perform external GitHub enrichment or must fall back to resume-only project analysis.
 *
 * 5. `Condition` (`conditionNode`)
 *    - This branch point checks whether a GitHub identifier was found. The intended logic is to proceed to GitHub analysis if the LLM output is not equal to `Github ID Not Found`; otherwise, it routes to the resume-only analysis path.
 *    - There is an implementation inconsistency in the condition expression: it references `{{LLMNode_571.output.generatedResponse}}` even though the actual upstream GitHub finder node in this flow is `LLMNode_728`. Operationally, the intended behavior is clear, but this mismatch may affect execution unless corrected by the runtime or template tooling.
 *
 * 6. `Github Projects Analyser` (`LLMNode`)
 *    - If a GitHub username is available, this node analyzes the candidate's public GitHub work using the configured prompts, model settings, and attached GitHub-focused tools.
 *    - Its purpose is to generate richer `project_insights` grounded in real repositories or profile activity rather than relying solely on self-described resume claims.
 *
 * 7. `Resume Projects Analyser` (`LLMNode`)
 *    - If no GitHub identity is found, this node analyzes the project and skills evidence present directly in the extracted resume text.
 *    - This is the fallback evidence-generation path, ensuring the flow can still continue even when no public GitHub account is available.
 *
 * 8. `Code` (`codeNode`)
 *    - This node receives the result from either `Github Projects Analyser` or `Resume Projects Analyser` and transforms or packages it for return into the supervisor loop.
 *    - The script source is externalized in `@scripts/hiring-agent_code.ts`, so the exact transformation logic is not shown in the flow definition. Based on the surrounding agent contract, this node most likely normalizes analysis into the `project_insights` shape expected by the supervisor's `Evaluator` branch.
 *
 * 9. `Agent Loop End` (`agentLoopEndNode`)
 *    - This node closes one iteration of the supervisor loop. If the parser branch has now produced the needed `project_insights`, control returns to the `Supervisor`, which can then choose the `Evaluator` branch.
 *    - It also serves as the collection point for final outputs generated by either the code-transformed parser result or the evaluator result.
 *
 * 10. `Insight Evaluator` (`InstructorLLMNode`)
 *    - When the supervisor selects the `Evaluator` path, this node consumes `project_insights` plus the `job_description` and produces a structured object with two required fields: `score` and `reasoning`.
 *    - `score` is numeric and represents how suitable the candidate is for the role. `reasoning` explains the logic behind that score in plain language.
 *    - Because this is an instructor-style node with an explicit schema, it is the strongest source of structured final decision data in the flow.
 *
 * 11. `Agent Loop End` (`agentLoopEndNode`, finalization pass)
 *    - After the evaluator completes, the result returns to the loop end node again, allowing the supervisor to finalize the interaction and emit `finalResponse`.
 *
 * 12. `API Response` (`graphqlResponseNode`)
 *    - The flow returns the final payload to the caller by mapping `{{agentLoopEndNode_558.output.finalResponse}}` into the response field `output`.
 *    - This is the only explicitly declared response field, making it the canonical contract for external callers.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow returns no useful hiring result | `resume_url` or `job_description` was missing from the API request, so the supervisor could not execute the intended branches | Validate both required fields before invocation and reject incomplete requests at the caller boundary |
 * | Resume extraction fails or produces empty content | The file at `resume_url` is inaccessible, not a valid PDF, password-protected, or malformed | Ensure the URL is reachable by the Lamatic runtime, provide a supported PDF file, and remove file access restrictions where possible |
 * | GitHub enrichment never runs even when a GitHub profile is in the resume | The condition node references `LLMNode_571` instead of the actual upstream node `LLMNode_728`, causing the branch check to misread or fail | Correct the condition expression to reference the real GitHub finder node output and retest the branch logic |
 * | Flow always falls back to resume-only analysis | The GitHub finder model could not confidently detect a username, or the branch condition treated the output as not found | Improve the GitHub finder prompts, ensure the resume includes profile links, and verify the condition logic and output format |
 * | GitHub project analysis fails | Required GitHub tool credentials or API access are missing, or the tool implementation cannot access the target profile/repositories | Configure the credentials expected by `@tools/hiring-agent_github-projects-analyser_tools.ts` and confirm outbound GitHub access in the runtime |
 * | LLM nodes error at runtime | Model provider credentials required by the referenced model configs are missing or invalid | Set the provider-specific environment variables used by the model configs and verify the selected models are available in the deployment |
 * | Final response shape is inconsistent across runs | The agent loop finalizes with different intermediate structures depending on branch behavior, and only `output` is formally mapped in the API response | Standardize the `Code` node output and supervisor finalization format so callers can rely on a stable response schema |
 * | Structured score or reasoning is missing | The evaluator branch was never invoked, or `project_insights` was not properly passed back into the supervisor loop | Inspect loop transitions between `Code`, `Agent Loop End`, and `Supervisor`, and verify the script output matches the evaluator input contract |
 * | Invocation from another system fails due to missing prior context | An external caller assumed an upstream flow would have already normalized or enriched the request, but this flow expects raw `resume_url` and `job_description` directly | Treat this flow as the entry-point screening flow and pass the raw required inputs explicitly |
 *
 * ## Notes
 * - The flow is designed as a supervisor loop rather than a strictly linear chain. That means the apparent visual order of nodes is less important than the branch contracts defined on the `Supervisor` agent.
 * - The `inputs` export is empty, but the runtime contract is still real and enforced implicitly by the supervisor branch schemas and prompt references.
 * - The branch condition contains a probable node-ID typo. This is the most important implementation caveat in the current definition because it can materially change whether GitHub enrichment is used.
 * - The `Code` node is essential to understanding the parser-to-evaluator handoff, but its script contents are not included here. If you need a rigid response contract for downstream automation, inspect `@scripts/hiring-agent_code.ts` and align it with the supervisor's expected `project_insights` field.
 * - The flow description says it provides detailed analysis of selection or rejection, but the only explicitly structured final schema in the visible graph is `score` plus `reasoning`. If you need a binary decision field such as `selected` or `rejected`, add that to the evaluator schema or enforce it in the supervisor final response.
 */

// Flow: hiring-agent

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Hiring Agent",
  "description": "This template allows you to analyse an input resume and gives detailed analysis of selection/rejection",
  "tags": [
    "🌱 Growth"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/hiring-agent",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "hiring_agent_supervisor_user": "@prompts/hiring-agent_supervisor_user.md",
    "hiring_agent_supervisor_system": "@prompts/hiring-agent_supervisor_system.md",
    "hiring_agent_github_username_finder_user": "@prompts/hiring-agent_github-username-finder_user.md",
    "hiring_agent_github_username_finder_system": "@prompts/hiring-agent_github-username-finder_system.md",
    "hiring_agent_github_projects_analyser_user": "@prompts/hiring-agent_github-projects-analyser_user.md",
    "hiring_agent_github_projects_analyser_system": "@prompts/hiring-agent_github-projects-analyser_system.md",
    "hiring_agent_resume_projects_analyser_user": "@prompts/hiring-agent_resume-projects-analyser_user.md",
    "hiring_agent_resume_projects_analyser_system": "@prompts/hiring-agent_resume-projects-analyser_system.md",
    "hiring_agent_insight_evaluator_user": "@prompts/hiring-agent_insight-evaluator_user.md",
    "hiring_agent_insight_evaluator_system": "@prompts/hiring-agent_insight-evaluator_system.md"
  },
  "scripts": {
    "hiring_agent_code": "@scripts/hiring-agent_code.ts"
  },
  "modelConfigs": {
    "hiring_agent_github_username_finder": "@model-configs/hiring-agent_github-username-finder.ts",
    "hiring_agent_github_projects_analyser": "@model-configs/hiring-agent_github-projects-analyser.ts",
    "hiring_agent_resume_projects_analyser": "@model-configs/hiring-agent_resume-projects-analyser.ts",
    "hiring_agent_insight_evaluator": "@model-configs/hiring-agent_insight-evaluator.ts"
  },
  "tools": {
    "hiring_agent_github_projects_analyser_tools": "@tools/hiring-agent_github-projects-analyser_tools.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "headers": "",
        "retries": "0",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "agentNode_852",
    "type": "agentNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentNode",
      "values": {
        "nodeName": "Supervisor",
        "tools": [],
        "agents": [
          {
            "name": "Parser",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"resume_url\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the resume url, from which the contents and links can be extracted\"\n    },\n    \"job_description\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the job description for which the applicant has applied with the current resume\"\n    }\n  }\n}",
            "description": "This path has to parse through the resume of the applicant and see for necessary skills and projects on their Github"
          },
          {
            "name": "Evaluator",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"project_insights\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This implies the project insights based on the resume of the user\"\n    },\n    \"job_description\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the job description for which the applicant has applied with the current resume\"\n    }\n  }\n}",
            "description": "This path would give a score based on the insights found from the projects and give reasoning for the same"
          }
        ],
        "prompts": [
          {
            "id": "7a2cf6d8-1d6d-4e69-a71c-0a4111ad4814",
            "role": "user",
            "content": "@prompts/hiring-agent_supervisor_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_supervisor_system.md"
          }
        ],
        "messages": "[]",
        "stopWord": "",
        "connectedTo": "agentLoopEndNode_558",
        "maxIterations": 5,
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "agentLoopEndNode_558",
    "type": "agentLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentLoopEndNode",
      "modes": {},
      "values": {
        "nodeName": "Agent Loop End",
        "connectedTo": "agentNode_852"
      }
    }
  },
  {
    "id": "extractFromFileNode_920",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "modes": {},
      "values": {
        "nodeName": "Extract from File",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{agentNode_852.output.resume_url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    }
  },
  {
    "id": "LLMNode_728",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Github Username Finder",
        "tools": [],
        "prompts": [
          {
            "id": "68482e18-8ce4-41d4-94b9-f24508922db1",
            "role": "user",
            "content": "@prompts/hiring-agent_github-username-finder_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_github-username-finder_system.md"
          }
        ],
        "memories": "@model-configs/hiring-agent_github-username-finder.ts",
        "messages": "@model-configs/hiring-agent_github-username-finder.ts",
        "attachments": "@model-configs/hiring-agent_github-username-finder.ts",
        "generativeModelName": "@model-configs/hiring-agent_github-username-finder.ts"
      }
    }
  },
  {
    "id": "conditionNode_160",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "modes": [],
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_727-addNode_373",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{LLMNode_571.output.generatedResponse}}\",\n      \"operator\": \"!=\",\n      \"value\": \"Github ID Not Found\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_727-addNode_369",
            "condition": {}
          }
        ]
      }
    }
  },
  {
    "id": "LLMNode_741",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Github Projects Analyser",
        "tools": "@tools/hiring-agent_github-projects-analyser_tools.ts",
        "prompts": [
          {
            "id": "6c9c3e7c-bb64-4047-9cac-3089ff468d62",
            "role": "user",
            "content": "@prompts/hiring-agent_github-projects-analyser_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_github-projects-analyser_system.md"
          }
        ],
        "memories": "@model-configs/hiring-agent_github-projects-analyser.ts",
        "messages": "@model-configs/hiring-agent_github-projects-analyser.ts",
        "attachments": "@model-configs/hiring-agent_github-projects-analyser.ts",
        "generativeModelName": "@model-configs/hiring-agent_github-projects-analyser.ts"
      }
    }
  },
  {
    "id": "codeNode_629",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Code",
        "code": "@scripts/hiring-agent_code.ts"
      }
    }
  },
  {
    "id": "LLMNode_867",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Resume Projects Analyser",
        "tools": [],
        "prompts": [
          {
            "id": "de7faf55-c2f6-43dd-bb31-f6c35e7399ae",
            "role": "user",
            "content": "@prompts/hiring-agent_resume-projects-analyser_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_resume-projects-analyser_system.md"
          }
        ],
        "memories": "@model-configs/hiring-agent_resume-projects-analyser.ts",
        "messages": "@model-configs/hiring-agent_resume-projects-analyser.ts",
        "attachments": "@model-configs/hiring-agent_resume-projects-analyser.ts",
        "generativeModelName": "@model-configs/hiring-agent_resume-projects-analyser.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_593",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Insight Evaluator",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"score\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"This defines the score of how ideal the candidate is to take further for the given job description\"\n    },\n    \"reasoning\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This defines the reasoning and logic for the score given to this candidate\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "9cf0d810-74c5-4b9c-aa00-96d706180916",
            "role": "user",
            "content": "@prompts/hiring-agent_insight-evaluator_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_insight-evaluator_system.md"
          }
        ],
        "memories": "@model-configs/hiring-agent_insight-evaluator.ts",
        "messages": "@model-configs/hiring-agent_insight-evaluator.ts",
        "attachments": "@model-configs/hiring-agent_insight-evaluator.ts",
        "generativeModelName": "@model-configs/hiring-agent_insight-evaluator.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_677",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{agentLoopEndNode_558.output.finalResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-agentNode_852",
    "source": "triggerNode_1",
    "target": "agentNode_852",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentNode_852-extractFromFileNode_920",
    "source": "agentNode_852",
    "target": "extractFromFileNode_920",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Parser",
      "invisible": false
    }
  },
  {
    "id": "agentNode_852-InstructorLLMNode_593",
    "source": "agentNode_852",
    "target": "InstructorLLMNode_593",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Evaluator",
      "invisible": false
    }
  },
  {
    "id": "agentNode_852-agentLoopEndNode_558",
    "source": "agentNode_852",
    "target": "agentLoopEndNode_558",
    "type": "agentLoopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Agent Loop End",
      "invisible": true
    }
  },
  {
    "id": "codeNode_629-agentLoopEndNode_558",
    "source": "codeNode_629",
    "target": "agentLoopEndNode_558",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_593-agentLoopEndNode_558",
    "source": "InstructorLLMNode_593",
    "target": "agentLoopEndNode_558",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentLoopEndNode_558-agentNode_852",
    "source": "agentLoopEndNode_558",
    "target": "agentNode_852",
    "type": "agentLoopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Agent Loop End",
      "invisible": false
    }
  },
  {
    "id": "extractFromFileNode_920-LLMNode_728",
    "source": "extractFromFileNode_920",
    "target": "LLMNode_728",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_728-conditionNode_160",
    "source": "LLMNode_728",
    "target": "conditionNode_160",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_727-addNode_373",
    "source": "conditionNode_160",
    "target": "LLMNode_741",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_727-addNode_369",
    "source": "conditionNode_160",
    "target": "LLMNode_867",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_741-codeNode_629",
    "source": "LLMNode_741",
    "target": "codeNode_629",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_867-codeNode_629",
    "source": "LLMNode_867",
    "target": "codeNode_629",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentLoopEndNode_558-graphqlResponseNode_677",
    "source": "agentLoopEndNode_558",
    "target": "graphqlResponseNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_677",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_677",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

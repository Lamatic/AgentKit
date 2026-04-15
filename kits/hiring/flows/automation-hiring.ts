/*
 * # 1. Hiring Automation
 * A single API-triggered hiring triage flow that acknowledges a candidate submission, evaluates the resume against a job context, sends the appropriate follow-up email, and returns a structured recommendation for the wider hiring system.
 *
 * ## Purpose
 * This flow is responsible for the end-to-end automation of first-pass candidate screening after a submission is received. It accepts candidate details and a resume file URL, sends an immediate acknowledgement email, extracts and collates resume contents, then asks an Instructor-style LLM to produce a structured evaluation with a score, strengths, weaknesses, and a final recommendation. It then uses that recommendation to send either an interview-style selection email or a rejection email.
 *
 * The outcome is both operational and analytical. Operationally, the candidate receives timely communication at two stages: immediate receipt confirmation and a later decision email. Analytically, the hiring team or calling application receives a structured evaluation object suitable for display, logging, or downstream automation. That matters because it turns an unstructured resume into a repeatable decision artifact while reducing recruiter response latency.
 *
 * Within the broader agent pipeline, this flow is the primary entry-point workflow for the hiring kit rather than a mid-pipeline helper. It sits across the full intake-to-decision chain: intake via API trigger, document extraction, synthesis via the LLM evaluator, branching via conditional logic, and outward communication via Gmail. In plan-retrieve-synthesize terms, it performs intake, retrieval from the candidate-provided document, synthesis of a recommendation, and action execution in a single orchestrated flow.
 *
 * ## When To Use
 * - Use when a candidate has submitted an application and you need to process it from intake through first-pass evaluation in one run.
 * - Use when the caller can provide a candidate `email`, `name`, `job_description`, and a reachable `resume_url` for the resume document.
 * - Use when you want the system to send an immediate acknowledgement email before evaluation completes.
 * - Use when you need a structured screening result with `score`, `strength`, `weakness`, and `recommendation`.
 * - Use when the application should automatically send the next-step candidate communication based on whether the recommendation is `Selected` or not.
 * - Use when this flow is being invoked by the kit's Next.js UI or any other system acting as the intake surface for new applicants.
 *
 * ## When Not To Use
 * - Do not use when the candidate has not yet submitted a resume or when no valid `resume_url` is available.
 * - Do not use when the resume is stored in an unsupported or inaccessible location, because the extraction step depends on fetching the file from the provided URL.
 * - Do not use when Gmail credentials have not been configured for the acknowledgement and follow-up mail nodes.
 * - Do not use when you only need document extraction or only need candidate scoring; this flow always performs the full acknowledgement, evaluation, decision, and email sequence.
 * - Do not use when a human reviewer must approve communications before any email is sent, because this flow sends emails automatically.
 * - Do not use for non-hiring document evaluation tasks or for candidate workflows that require multi-stage interview scheduling, offer generation, or ATS writeback handled outside this kit.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `name` | `string` | Yes | Candidate name used by the flow's email-preparation scripts and evaluation context. |
 * | `email` | `string` | Yes | Candidate email address used as the recipient for acknowledgement, selection, or rejection emails. |
 * | `job_description` | `string` | Yes | Role or job context the model uses to assess candidate fit. The test input shows a concise role title, but richer job context may also be provided if the deployed schema allows it. |
 * | `resume_url` | `string` | Yes | Publicly reachable or otherwise fetchable URL to the candidate resume file consumed by the file extraction node. |
 *
 * Notable constraints and assumptions:
 * - `email` must be a valid deliverable email address because three separate Gmail send nodes may use it as `recipient_email`.
 * - `resume_url` must point to a PDF, as the extraction node is configured with `format` set to `pdf` and joins pages into a single extraction result.
 * - The trigger source is an API request node, so callers must match the deployed Lamatic trigger schema exactly even though the flow source only reveals the concrete fields used downstream.
 * - The flow assumes the resume file is accessible at runtime without interactive authentication.
 * - `job_description` is treated as evaluation context, so low-detail values may reduce recommendation quality even if the flow completes successfully.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `object` | Structured candidate evaluation returned from `Evaluate Candidate`, including `score`, `strength`, `weakness`, and `recommendation`. |
 *
 * The API response is a structured object wrapped under the single top-level field `output`. That object is generated by the Instructor LLM node against an explicit schema, so callers should expect a machine-readable JSON-like payload rather than free-form prose. The response reflects the evaluation result, not the contents of the emails that were sent. If upstream extraction or model execution fails, the response may not be produced at all.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is the entry-point flow for the hiring kit and is invoked directly by an external caller such as the included Next.js application.
 * - The effective prerequisite is not another Lamatic flow but an external submission step that has already collected candidate details and uploaded the resume somewhere accessible, producing the `resume_url` consumed here.
 *
 * ### Downstream Flows
 * - None as separate Lamatic flows. The flow completes the full sequence internally and returns its evaluation to the caller.
 * - The primary downstream consumer is the invoking application, which uses the `output` field to display or persist the screening result.
 * - Candidate communications are also downstream effects, but they are executed inside this same flow through Gmail nodes rather than via separate flows.
 *
 * ### External Services
 * - Lamatic API trigger/runtime — receives the API request and returns the final API response — Lamatic project deployment and API configuration
 * - Gmail connector — sends acknowledgement, selection, and rejection emails — Gmail credentials configured on `gmailNode_506`, `gmailNode_995`, and `gmailNode_194`
 * - File extraction service — fetches and parses the resume PDF from `resume_url` — no explicit credential shown in-flow; depends on the file being accessible at runtime
 * - Instructor-compatible LLM provider — evaluates the candidate and emits schema-constrained structured output — model credentials and model selection configured through `InstructorLLMNode_145`
 *
 * ### Environment Variables
 * - `AUTOMATION_HIRING` — Lamatic deployment/config key used by the surrounding application to invoke the deployed flow — used outside the flow by the calling app, not by a specific in-flow node
 * - `LAMATIC_API_URL` — Lamatic API endpoint for the surrounding application — used outside the flow by the caller that triggers `API Request`
 * - `LAMATIC_PROJECT_ID` — Lamatic project routing/auth context for the surrounding application — used outside the flow by the caller that triggers `API Request`
 * - `LAMATIC_API_KEY` — Lamatic API authentication for the surrounding application — used outside the flow by the caller that triggers `API Request`
 * - Gmail credential configuration — required to authorize `Send Acknowledgement`, `Send Interview Mail`, and `Send Rejection Mail`
 * - LLM provider credential configuration — required to authorize `Evaluate Candidate`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`, trigger) receives the candidate submission that starts the flow. The downstream nodes read `name`, `email`, `job_description`, and `resume_url` from this trigger output.
 *
 * 2. `Prepare Receipt Email` (`codeNode`) generates the acknowledgement email body. It prepares the content that will later be inserted into the first Gmail send step, likely using the candidate context from the trigger.
 *
 * 3. `Send Acknowledgement` (`gmailNode`) sends an HTML email with the subject `Application Received – Lamatic.ai` to `{{triggerNode_1.output.email}}`. Its body comes directly from `Prepare Receipt Email`, giving the candidate immediate confirmation that the application was received.
 *
 * 4. `Extract Resume` (`extractFromFileNode`) fetches the file at `{{triggerNode_1.output.resume_url}}` and parses it as a PDF. The node is configured to join pages, so the extracted content is treated as one combined document for later evaluation.
 *
 * 5. `Collate Resume Contents` (`codeNode`) normalizes or restructures the extracted resume material into the form expected by the evaluation prompt and model configuration. This is the bridge between raw parsed document text and the LLM-ready candidate context.
 *
 * 6. `Evaluate Candidate` (`InstructorLLMNode`) runs the hiring evaluation using the referenced system and user prompts plus the attached model configuration. It produces a schema-constrained object with four required fields: `score`, `strength`, `weakness`, and `recommendation`. The `recommendation` is especially important because the next node branches on whether it equals `Selected`.
 *
 * 7. `Condition` (`conditionNode`) inspects `{{InstructorLLMNode_145.output.recommendation}}`. If the value is exactly `Selected`, execution follows the selection branch; otherwise it follows the `Else` branch, which functions as rejection.
 *
 * 8. `Prepare Selection Mail` (`codeNode`) runs only on the `Selected` branch. It generates the HTML body for the positive follow-up email sent to successful candidates.
 *
 * 9. `Send Interview Mail` (`gmailNode`) runs after `Prepare Selection Mail` and sends an HTML email with the subject `Congratulations - Lamatic.ai` to the candidate's email address.
 *
 * 10. `Prepare Rejection Mail` (`codeNode`) runs only on the `Else` branch. It generates the HTML body for the rejection or non-advancement message.
 *
 * 11. `Send Rejection Mail` (`gmailNode`) runs after `Prepare Rejection Mail` and sends an HTML email with the subject `Application Update – Lamatic.ai` to the candidate's email address.
 *
 * 12. `API Response` (`graphqlResponseNode`) returns the final structured evaluation to the caller. Its output mapping places the entire `Evaluate Candidate` result under the response field `output`, regardless of which email branch was taken.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails when trying to send acknowledgement or follow-up emails | Gmail credentials were not configured for one or more Gmail nodes | Configure valid Gmail credentials for `gmailNode_506`, `gmailNode_995`, and `gmailNode_194`, then redeploy or update the flow configuration |
 * | Candidate receives no acknowledgement email | Invalid `email`, Gmail authentication failure, or the acknowledgement body script returned unusable content | Verify the trigger payload contains a valid `email`, confirm Gmail credentials, and test `Prepare Receipt Email` output |
 * | Resume extraction returns empty or fails | `resume_url` is broken, inaccessible, expired, or not actually a PDF | Ensure `resume_url` is reachable by the Lamatic runtime, points to a valid PDF, and remains accessible long enough for processing |
 * | Evaluation output is missing fields or the model step errors | Model provider configuration is incomplete or the prompt/context supplied to the model is insufficient | Check `InstructorLLMNode_145` model credentials and selected model, then verify resume extraction and collation produced usable content |
 * | Candidate is always rejected unexpectedly | The recommendation did not exactly equal `Selected`, so the `Else` branch fired | Inspect the `recommendation` value returned by `Evaluate Candidate` and align prompt behavior or branch logic to accepted output values |
 * | API caller gets no final response | A node before `API Response` failed, preventing either branch from reaching the response node | Review run logs for the first failing node, especially extraction, model execution, and Gmail send nodes |
 * | Output is low quality despite successful execution | `job_description` is too brief or resume text extraction lost important formatting/content | Provide richer job context and verify the extracted resume text contains the candidate's substantive experience |
 * | Trigger invocation fails before the flow runs | Caller did not match the deployed API trigger schema or did not provide required fields | Validate the request payload against the deployed Lamatic flow contract and include `name`, `email`, `job_description`, and `resume_url` |
 * | Runtime cannot access the resume file even though it exists locally in the app | The file was uploaded to a private or environment-specific location without public/runtime access | Store resumes in a location accessible to the Lamatic runtime and pass the resulting fetchable URL as `resume_url` |
 * | Expected upstream flow data is unavailable | An external intake step that should have produced the candidate details or file URL never completed | Ensure the submission UI or upstream application uploads the file successfully and passes the resulting metadata into this flow |
 *
 * ## Notes
 * - The flow sends an acknowledgement email before resume evaluation starts, so candidates may receive confirmation even if later extraction or evaluation fails.
 * - The API response is delivered at the end of the full flow path in the current graph, not as an immediate early acknowledgement. Operators should expect total latency to include file extraction, model evaluation, branching, and the final email send.
 * - Branching is based on an exact string comparison against `Selected`. Any alternate capitalization or wording from the model may send execution down the rejection branch unless the prompts tightly constrain output.
 * - The `strength` and `weakness` fields are typed as strings, so even if they conceptually contain lists, callers should not assume array semantics unless the prompts/scripts are changed.
 * - The flow source shows an empty `advance_schema` on the trigger node, so the deployed trigger contract should be verified in Lamatic Studio before integrating external callers.
 * - All outbound emails are configured as HTML messages, so the code scripts preparing those bodies should produce valid HTML-safe content.
 */

// Flow: automation-hiring

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Hiring Automation",
  "description": "",
  "tags": [],
  "testInput": {
    "name": "Dhruv Pamneja",
    "email": "dhruvp@lamatic.ai",
    "job_description": "Frontend Engineer",
    "resume_url": "https://aseskssykbhhiborrwws.supabase.co/storage/v1/object/public/alpha/DhruvP_Resume.pdf"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "gmailNode_506": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for Gmail authentication. Required to access the Gmail API.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "InstructorLLMNode_145": [
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
  "gmailNode_995": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for Gmail authentication. Required to access the Gmail API.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "gmailNode_194": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for Gmail authentication. Required to access the Gmail API.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
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
    "evaluate_candidate_system": "@prompts/evaluate-candidate-system.md",
    "automation_hiring_evaluate_candidate_user": "@prompts/automation-hiring_evaluate-candidate_user.md"
  },
  "modelConfigs": {
    "automation_hiring_evaluate_candidate": "@model-configs/automation-hiring_evaluate-candidate.ts"
  },
  "scripts": {
    "automation_hiring_prepare_receipt_email": "@scripts/automation-hiring_prepare-receipt-email.ts",
    "automation_hiring_collate_resume_contents": "@scripts/automation-hiring_collate-resume-contents.ts",
    "automation_hiring_prepare_selection_mail": "@scripts/automation-hiring_prepare-selection-mail.ts",
    "automation_hiring_prepare_rejection_mail": "@scripts/automation-hiring_prepare-rejection-mail.ts"
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
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "gmailNode_506",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "bcc": "",
        "body": "{{codeNode_218.output}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": true,
        "subject": "Application Received – Lamatic.ai",
        "to_user": "",
        "nodeName": "Send Acknowledgement",
        "from_user": "",
        "credentials": "",
        "max_results": 10,
        "recipient_email": "{{triggerNode_1.output.email}}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_218",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_prepare-receipt-email.ts",
        "nodeName": "Prepare Receipt Email"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"output\": \"{{InstructorLLMNode_145.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1350
    },
    "selected": false
  },
  {
    "id": "codeNode_861",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_collate-resume-contents.ts",
        "nodeName": "Collate Resume Contents"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "extractFromFileNode_376",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "extractFromFileNode",
      "values": {
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.resume_url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "nodeName": "Extract Resume",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_145",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"score\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"score between 1 to 10 upto two decimal places\"\n    },\n    \"strength\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"list of strengths of candidate\"\n    },\n    \"weakness\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"list of weaknesses of candidate\"\n    },\n    \"recommendation\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"final verdict of being 'Selected' or 'Rejected'\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/evaluate-candidate-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/automation-hiring_evaluate-candidate_user.md"
          }
        ],
        "memories": "@model-configs/automation-hiring_evaluate-candidate.ts",
        "messages": "@model-configs/automation-hiring_evaluate-candidate.ts",
        "nodeName": "Evaluate Candidate",
        "attachments": "@model-configs/automation-hiring_evaluate-candidate.ts",
        "generativeModelName": "@model-configs/automation-hiring_evaluate-candidate.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "conditionNode_463",
    "data": {
      "label": "Condition",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_463-addNode_438",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{InstructorLLMNode_145.output.recommendation}}\",\n      \"operator\": \"==\",\n      \"value\": \"Selected\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_463-addNode_598",
            "condition": {}
          }
        ]
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "codeNode_362",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_prepare-selection-mail.ts",
        "nodeName": "Prepare Selection Mail"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "codeNode_803",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/automation-hiring_prepare-rejection-mail.ts",
        "nodeName": "Prepare Rejection Mail"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "gmailNode_995",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "bcc": "",
        "body": "{{codeNode_362.output}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": true,
        "subject": "Congratulations - Lamatic.ai",
        "to_user": "",
        "nodeName": "Send Interview Mail",
        "from_user": "",
        "credentials": "",
        "max_results": 10,
        "recipient_email": "{{triggerNode_1.output.email}}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1200
    },
    "selected": false
  },
  {
    "id": "gmailNode_194",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "bcc": "",
        "body": "{{codeNode_803.output}}",
        "action": "GMAIL_SEND_EMAIL",
        "is_html": true,
        "subject": "Application Update – Lamatic.ai",
        "to_user": "",
        "nodeName": "Send Rejection Mail",
        "from_user": "",
        "credentials": "",
        "max_results": 10,
        "recipient_email": "{{triggerNode_1.output.email}}"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_218",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_218",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_218-gmailNode_506",
    "type": "defaultEdge",
    "source": "codeNode_218",
    "target": "gmailNode_506",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "gmailNode_506-extractFromFileNode_376",
    "data": {},
    "type": "defaultEdge",
    "source": "gmailNode_506",
    "target": "extractFromFileNode_376",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "extractFromFileNode_376-codeNode_861",
    "type": "defaultEdge",
    "source": "extractFromFileNode_376",
    "target": "codeNode_861",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_861-InstructorLLMNode_145",
    "type": "defaultEdge",
    "source": "codeNode_861",
    "target": "InstructorLLMNode_145",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_145-conditionNode_463",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_145",
    "target": "conditionNode_463",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_463-codeNode_362-429",
    "data": {
      "condition": "Condition 1",
      "branchName": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_463",
    "target": "codeNode_362",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_463-codeNode_803-862",
    "data": {
      "condition": "Else",
      "branchName": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_463",
    "target": "codeNode_803",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_362-gmailNode_995",
    "type": "defaultEdge",
    "source": "codeNode_362",
    "target": "gmailNode_995",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "gmailNode_995-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "gmailNode_995",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_803-gmailNode_194",
    "type": "defaultEdge",
    "source": "codeNode_803",
    "target": "gmailNode_194",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "gmailNode_194-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "gmailNode_194",
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

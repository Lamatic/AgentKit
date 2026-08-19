/*
 * # Interview Prep Generator
 * An agentic pipeline that turns a job description and a Google-Drive-hosted resume into a resume-grounded interview prep kit, guarded against prompt injection and enriched with live company research.
 *
 * ## Purpose
 * This flow takes a job description, a public Google Drive link to a resume, and an optional company name, and produces a focused interview prep kit: a role summary, likely questions grouped by category, resume-grounded STAR answer outlines, an honest gap analysis, and a study checklist. Unlike a single prompt-and-generate template, it is built as an agent infrastructure: a Supervisor node orchestrates specialist branches (a deterministic prompt-injection guardrail, an optional factual search lookup, and an optional live browsing research step) and decides what data reaches the final generation call.
 *
 * Before any of that runs, the flow verifies the caller's resume link is actually publicly accessible and stops immediately - before spending a single LLM call - if it isn't, returning a specific, actionable error instead of a generic failure.
 *
 * ## When To Use
 * - Use when a caller has a job description and a candidate resume and wants a tailored, resume-grounded interview prep kit rather than generic advice.
 * - Use when the caller can share the resume as a Google Drive link with "Anyone with the link" viewer access, rather than pasting raw resume text or uploading a file directly.
 * - Use when you want defense-in-depth against prompt injection embedded in either the job description or a resume PDF (including hidden/invisible text designed to manipulate an LLM screener).
 * - Use when optional live company research (search results and/or a live browsing summary) should inform the Study Checklist and Culture & Motivation questions, without ever being presented as something the candidate already knows.
 *
 * ## When Not To Use
 * - Do not use when the resume cannot be shared as a public Google Drive link; this flow does not accept raw resume text or direct file uploads.
 * - Do not use for general resume screening, candidate ranking, or hiring decisions - this flow is written from the candidate's perspective, to help them prepare, not to evaluate them.
 * - Do not use if `company_name` is required for your use case but Fact Lookup (Tavily) and Context Assembly (Browser Use) credentials are not configured; the flow degrades gracefully but produces no company-specific research without them.
 * - Do not use as a downstream step expecting synchronous sub-second latency; the Supervisor loop plus optional live search/browsing can take significantly longer than a single LLM call.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `job_description` | `string` | Yes | Full text of the job posting. |
 * | `resume` | `string` | Yes | A Google Drive share link to the candidate's resume PDF, set to "Anyone with the link" viewer access (e.g. `.../file/d/FILE_ID/view`, `.../open?id=FILE_ID`, or a bare file ID). |
 * | `company_name` | `string` | No | Target company name. When present, enables the optional Fact Lookup and Context Assembly research branches. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `status` | `string` | One of `ok`, `blocked`, or `error`. |
 * | `interview_prep` | `string` | The generated Markdown interview prep kit. Empty unless `status` is `ok`. |
 * | `message` | `string` | Human-readable explanation. Populated when `status` is `blocked` or `error`. |
 * | `findings` | `array` | Guardrail findings when `status` is `blocked`; empty otherwise. |
 * | `usedCompanyResearch` | `boolean` | Whether live search and/or browsing research was actually incorporated. |
 *
 * ## Dependencies
 * ### Upstream Flows
 * None. This is a standalone entry-point flow.
 *
 * ### Downstream Flows
 * None described. The typical consumer is an application calling the deployed flow's API endpoint directly.
 *
 * ### External Services
 * - Google Drive (unauthenticated direct-download endpoint) - used to verify the resume link is public and to fetch the PDF bytes for extraction - no credential required, but the link must be shared as "Anyone with the link".
 * - Tavily Search API (`https://api.tavily.com/search`) - used by Fact Lookup for structured company research - requires the Lamatic secret `SEARCH_API_KEY`.
 * - Browser Use Cloud API v4 (`https://api.browser-use.com/api/v4`) - used by Context Assembly for live browsing research against the company's public pages - requires the Lamatic secret `BROWSER_USE_API_KEY`.
 * - A chat-capable text model, selected in Studio for both the Supervisor and Generate Text nodes.
 *
 * ### Environment Variables / Secrets
 * - `SEARCH_API_KEY` - Tavily API key, configured as a Lamatic project secret - used by the Fact Lookup node.
 * - `BROWSER_USE_API_KEY` - Browser Use Cloud API key, configured as a Lamatic project secret - used by the Context Assembly node.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) - receives `job_description`, `resume` (a Drive link), and `company_name`.
 * 2. `Resolve Drive URL` (`codeNode`) - parses the Drive link into a file ID and direct-download URL.
 * 3. `verify resume is public` (`apiNode`) - GETs the direct-download URL.
 * 4. `is resume public` (`codeNode`) - distinguishes a real PDF response from Google's HTML sign-in/permission-denied interstitial.
 * 5. `Condition` (`conditionNode`) - branches on whether the link is public.
 *    - Public → `continue` (`codeNode`) → `Extract from File` (`extractFromFileNode`, PDF, joined pages) → `Resolve Resume Text` (`codeNode`), which becomes the single source of truth for "the resume" downstream.
 *    - Not public → `Not Public Error` (`codeNode`), which shapes an error response using the same field names as the success path, then converges directly into `Aggregator`, short-circuiting the entire agentic pipeline below (no LLM call is made).
 * 6. `Supervisor` (`agentNode`, ReAct-style loop, max 5 iterations) - orchestrates three specialist branches and a loop-terminator:
 *    - `Guardrail` (`codeNode`) - deterministic, non-LLM scan of `job_description` and the resolved resume text for prompt-injection / instruction-override patterns. Always called first.
 *    - `Fact Lookup` (`apiNode`) - Tavily search for `"<company_name> interview process engineering culture"`. Optional; only called when `company_name` is present.
 *    - `Research & Generate` - `Context Assembly` (`codeNode`, Browser Use v4: creates a hosted browsing run, polls it to completion, and returns a live research summary) → `Merge Research Context` (`codeNode`, combines Tavily results and the Browser Use summary into one text block, and is the source of truth for `usedCompanyResearch`) → `Generate Text` (`LLMNode`, the actual synthesis call). Only called after Guardrail reports `safe:true`.
 *    - `Agent Loop End` (`agentLoopEndNode`) - terminates the loop, called immediately after Guardrail reports `safe:false` or after Research & Generate produces a result.
 * 7. `Aggregator` (`codeNode`) - the single chokepoint deciding what the caller sees: passes through the Not Public Error if present, returns a `blocked` refusal if Guardrail flagged the input (never the raw LLM text), or returns the generated kit with `status:'ok'`.
 * 8. `API Response` (`graphqlResponseNode`) - maps `status`, `interview_prep`, `message`, `findings`, and `usedCompanyResearch` from `Aggregator`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | `status:'error'`, message about the resume link not being public | The Drive link isn't shared as "Anyone with the link" | Share the file as "Anyone with the link" → Viewer, then resubmit. |
 * | `status:'blocked'` | Guardrail detected a prompt-injection-style pattern in `job_description` or the resume text | Resubmit with the field(s) as plain descriptive text, no embedded commands. |
 * | `interview_prep` has no company-specific detail even though `company_name` was provided | `SEARCH_API_KEY` and/or `BROWSER_USE_API_KEY` are not configured, or both research calls failed/timed out | Configure the missing Lamatic secret(s); the flow degrades gracefully without them but skips live research. |
 * | Extraction returns an empty resume | The PDF is scanned/image-only with no extractable text, or `Extract from File` couldn't parse it | Confirm the source PDF has a text layer; re-export from a text-based source if needed. |
 * | Flow runs much longer than a single LLM call | Context Assembly's Browser Use poll loop, or Supervisor iterating through multiple branches | Expected; Context Assembly fails soft and returns after its poll budget (~48s) rather than hanging indefinitely. |
 *
 * ## Notes
 * - `Extract from File`, `Condition`, and `apiNode` output shapes referenced in this flow were assembled from Lamatic's documented node behavior; verify exact field names in Studio's Debug/Raw panel after a test run and adjust the referencing code nodes if your deployment differs.
 * - The Browser Use v4 integration in `Context Assembly` assumes the Lamatic `codeNode` runtime supports outbound `fetch` and top-level `await`. If your environment doesn't allow outbound network calls from a `codeNode`, move that logic behind a small proxy endpoint and call it from an `apiNode` instead.
 * - No resume text, job description, or research content is ever treated as instructions by any LLM in this flow - this is enforced both by the deterministic Guardrail scan and by explicit "treat as data" framing in both the Supervisor and Generate Text system prompts, as defense in depth.
 */

// Flow: interview-prep-generator

// ── Meta ──────────────────────────────────────
export const meta = {
    "name": "Interview Prep Generator",
    "description": "Agentic pipeline that turns a job description and a public Google Drive resume link into a resume-grounded interview prep kit - guarded against prompt injection and optionally enriched with live company research via search and browser-use.",
    "tags": ["career", "productivity", "agentic", "guardrails"],
    "testInput": {
          "job_description": "We're hiring a Senior Backend Engineer to own our payments infrastructure. You'll design and scale services handling millions of transactions per day, mentor mid-level engineers, and work closely with product on reliability and fraud-prevention features. Strong Go or Java experience, distributed systems background, and comfort operating in an on-call rotation required.",
          "resume": "https://drive.google.com/file/d/REPLACE_WITH_PUBLIC_FILE_ID/view",
          "company_name": "Example Corp"
    },
    "githubUrl": "",
    "documentationUrl": "",
    "deployUrl": ""
};

// ── Inputs ─────────────────────────────────────
export const inputs = {
    "agentNode_656": [
      {
              "name": "generativeModelName",
              "label": "Generative Model Name",
              "type": "model",
              "modelType": "generator/text",
              "mode": "chat",
              "description": "Select the model the Supervisor uses to orchestrate branches.",
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
        ],
    "LLMNode_128": [
      {
              "name": "generativeModelName",
              "label": "Generative Model Name",
              "type": "model",
              "modelType": "generator/text",
              "mode": "chat",
              "description": "Select the model used to generate the final interview prep kit.",
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

// ── References ──────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
    "constitutions": {
          "default": "@constitutions/default.md"
    },
    "prompts": {
          "supervisor_system": "@prompts/interview-prep-generator_supervisor_system.md",
          "supervisor_user": "@prompts/interview-prep-generator_supervisor_user.md",
          "generate_text_system": "@prompts/interview-prep-generator_generate-text_system.md",
          "generate_text_user": "@prompts/interview-prep-generator_generate-text_user.md"
    },
    "modelConfigs": {
          "supervisor": "@model-configs/interview-prep-generator_supervisor.ts",
          "generate_text": "@model-configs/interview-prep-generator_generate-text.ts"
    },
    "scripts": {
          "resolve_drive_url": "@scripts/interview-prep-generator_resolve-drive-url.ts",
          "is_resume_public": "@scripts/interview-prep-generator_is-resume-public.ts",
          "continue_": "@scripts/interview-prep-generator_continue.ts",
          "not_public_error": "@scripts/interview-prep-generator_not-public-error.ts",
          "resolve_resume_text": "@scripts/interview-prep-generator_resolve-resume-text.ts",
          "guardrail": "@scripts/interview-prep-generator_guardrail.ts",
          "context_assembly": "@scripts/interview-prep-generator_context-assembly.ts",
          "merge_research_context": "@scripts/interview-prep-generator_merge-research-context.ts",
          "aggregator": "@scripts/interview-prep-generator_aggregator.ts"
    }
};

// ── Nodes & Edges ────────────────────────────
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
                          "advance_schema": "{\n  \"job_description\": \"string\",\n  \"resume\": \"string\",\n  \"company_name\": \"string\"\n}"
                },
                "trigger": true
        },
        "type": "triggerNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 760, "y": 0 },
        "selected": false
  },
  {
        "id": "codeNode_204",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_resolve-drive-url.ts",
                          "nodeName": "Resolve Drive URL"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 760, "y": 150 },
        "selected": false
  },
  {
        "id": "apiNode_649",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "apiNode",
                "values": {
                          "url": "{{codeNode_204.output.directUrl}}",
                          "method": "GET",
                          "headers": "",
                          "body": "",
                          "retries": "1",
                          "retry_deplay": "500",
                          "convertXmlResponseToJson": false,
                          "nodeName": "verify resume is public"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 760, "y": 300 },
        "selected": false
  },
  {
        "id": "codeNode_395",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_is-resume-public.ts",
                          "nodeName": "is resume public"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 760, "y": 450 },
        "selected": false
  },
  {
        "id": "conditionNode_834",
        "data": {
                "label": "Condition",
                "modes": [],
                "nodeId": "conditionNode",
                "values": {
                          "nodeName": "Condition",
                          "allowMultipleConditionExecution": false,
                          "conditions": [
                            {
                                          "label": "Condition 1",
                                          "value": "conditionNode_834-addNode_348",
                                          "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_395.output.isPublic}}\",\n      \"operator\": \"equals\",\n      \"value\": \"true\"\n    }\n  ]\n}"
                            },
                            {
                                          "label": "Else",
                                          "value": "conditionNode_834-addNode_121",
                                          "condition": {}
                            }
                                    ]
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 760, "y": 600 },
        "selected": false
  },
  {
        "id": "codeNode_980",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_continue.ts",
                          "nodeName": "continue"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 550, "y": 750 },
        "selected": false
  },
  {
        "id": "codeNode_641",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_not-public-error.ts",
                          "nodeName": "Not Public Error"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 1100, "y": 750 },
        "selected": false
  },
  {
        "id": "extractFromFileNode_510",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "extractFromFileNode",
                "values": {
                          "id": "extractFromFileNode_510",
                          "fileUrl": "[\"{{codeNode_980.output.directUrl}}\"]",
                          "format": "pdf",
                          "encodeAsBase64": false,
                          "delimiter": ",",
                          "headers": true,
                          "quote": "\"",
                          "ignoreEmpty": false,
                          "comment": "null",
                          "discardUnmappedColumns": false,
                          "trim": false,
                          "rtrim": false,
                          "ltrim": false,
                          "maxRows": "0",
                          "skipRows": "0",
                          "encoding": "utf8",
                          "returnRawText": false,
                          "joinPages": true,
                          "password": "",
                          "nodeName": "Extract from File"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 550, "y": 900 },
        "selected": false
  },
  {
        "id": "codeNode_912",
        "data": {
                "label": "New",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_resolve-resume-text.ts",
                          "nodeName": "Resolve Resume Text"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 550, "y": 1050 },
        "selected": false
  },
  {
        "id": "agentNode_656",
        "data": {
                "label": "Supervisor",
                "modes": {},
                "nodeId": "agentNode",
                "values": {
                          "tools": [],
                          "agents": [
                            {
                                          "name": "Guardrail",
                                          "description": "Deterministically scans job_description and resume for prompt-injection or instruction-override attempts before any LLM sees them. Always called first, every run.",
                                          "schema": { "safe": "boolean", "findings": "array" }
                            },
                            {
                                          "name": "Fact Lookup",
                                          "description": "Looks up live factual context about the target company (culture, interview process, recent news) via an external search tool. Optional - only called when company_name is non-empty.",
                                          "schema": { "results": "array" }
                            },
                            {
                                          "name": "Research & Generate",
                                          "description": "Assembles live browsing and search context, then synthesizes the final interview prep kit from the resume, job description, and that context. Only called after Guardrail has passed.",
                                          "schema": { "generatedResponse": "string" }
                            }
                                    ],
                          "prompts": [
                            {
                                          "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
                                          "role": "system",
                                          "content": "@prompts/interview-prep-generator_supervisor_system.md"
                            },
                            {
                                          "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
                                          "role": "user",
                                          "content": "@prompts/interview-prep-generator_supervisor_user.md"
                            }
                                    ],
                          "messages": "[]",
                          "stopWord": "",
                          "maxIterations": 5,
                          "connectedTo": "agentLoopEndNode_742",
                          "nodeName": "Supervisor",
                          "generativeModelName": "@model-configs/interview-prep-generator_supervisor.ts"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 95 },
        "position": { "x": 760, "y": 1200 },
        "selected": false
  },
  {
        "id": "codeNode_326",
        "data": {
                "label": "Guardrail",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_guardrail.ts",
                          "nodeName": "Guardrail",
                          "connectedTo": "agentNode_656"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 1050, "y": 1080 },
        "selected": false
  },
  {
        "id": "apiNode_365",
        "data": {
                "label": "Fact Lookup",
                "modes": {},
                "nodeId": "apiNode",
                "values": {
                          "url": "https://api.tavily.com/search",
                          "method": "POST",
                          "headers": [
                            { "key": "Content-Type", "value": "application/json" }
                                    ],
                          "body": "{\n  \"api_key\": \"{{secrets.SEARCH_API_KEY}}\",\n  \"query\": \"{{triggerNode_1.output.company_name}} interview process engineering culture\",\n  \"search_depth\": \"basic\",\n  \"max_results\": 5\n}",
                          "nodeName": "Fact Lookup",
                          "connectedTo": "agentNode_656"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 1050, "y": 1200 },
        "selected": false
  },
  {
        "id": "codeNode_718",
        "data": {
                "label": "Context Assembly",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_context-assembly.ts",
                          "nodeName": "Context Assembly",
                          "connectedTo": "agentNode_656"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 1050, "y": 1320 },
        "selected": false
  },
  {
        "id": "codeNode_729",
        "data": {
                "label": "Merge Research Context",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_merge-research-context.ts",
                          "nodeName": "Merge Research Context",
                          "connectedTo": "agentNode_656"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 1350, "y": 1200 },
        "selected": false
  },
  {
        "id": "LLMNode_128",
        "data": {
                "label": "Generate Text",
                "modes": {},
                "nodeId": "LLMNode",
                "values": {
                          "prompts": [
                            {
                                          "id": "27c2f4b1-c23d-4545-abef-73dc897d6b71",
                                          "role": "system",
                                          "content": "@prompts/interview-prep-generator_generate-text_system.md"
                            },
                            {
                                          "id": "27c2f4b1-c23d-4545-abef-73dc897d6b72",
                                          "role": "user",
                                          "content": "@prompts/interview-prep-generator_generate-text_user.md"
                            }
                                    ],
                          "messages": "@model-configs/interview-prep-generator_generate-text.ts",
                          "nodeName": "Generate Text",
                          "attachments": "@model-configs/interview-prep-generator_generate-text.ts",
                          "connectedTo": "agentNode_656",
                          "credentials": "@model-configs/interview-prep-generator_generate-text.ts",
                          "generativeModelName": "@model-configs/interview-prep-generator_generate-text.ts"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 1650, "y": 1200 },
        "selected": false
  },
  {
        "id": "agentLoopEndNode_742",
        "data": {
                "label": "Agent Loop End",
                "modes": {},
                "nodeId": "agentLoopEndNode",
                "values": {
                          "nodeName": "Agent Loop End",
                          "connectedTo": "codeNode_536"
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 760, "y": 1450 },
        "selected": false
  },
  {
        "id": "codeNode_536",
        "data": {
                "label": "Aggregator",
                "modes": {},
                "nodeId": "codeNode",
                "values": {
                          "code": "@scripts/interview-prep-generator_aggregator.ts",
                          "nodeName": "Aggregator",
                          "connectedTo": ""
                }
        },
        "type": "dynamicNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 760, "y": 1570 },
        "selected": false
  },
  {
        "id": "responseNode_1",
        "data": {
                "label": "API Response",
                "modes": {},
                "nodeId": "graphqlResponseNode",
                "values": {
                          "response": "{{codeNode_536.output}}",
                          "nodeName": "API Response"
                }
        },
        "type": "responseNode",
        "measured": { "width": 218, "height": 61 },
        "position": { "x": 760, "y": 1690 },
        "selected": false
  }
  ];

export const edges = [
  { "id": "e1", "type": "defaultEdge", "source": "triggerNode_1", "target": "codeNode_204", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e2", "type": "defaultEdge", "source": "codeNode_204", "target": "apiNode_649", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e3", "type": "defaultEdge", "source": "apiNode_649", "target": "codeNode_395", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e4", "type": "defaultEdge", "source": "codeNode_395", "target": "conditionNode_834", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e5", "type": "conditionEdge", "source": "conditionNode_834", "target": "codeNode_980", "sourceHandle": "bottom", "targetHandle": "top", "data": { "condition": "isPublic === true", "branchName": "Condition-1" } },
  { "id": "e6", "type": "conditionEdge", "source": "conditionNode_834", "target": "codeNode_641", "sourceHandle": "bottom", "targetHandle": "top", "data": { "condition": "else", "branchName": "Else" } },
  { "id": "e7", "type": "defaultEdge", "source": "codeNode_980", "target": "extractFromFileNode_510", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e8", "type": "defaultEdge", "source": "extractFromFileNode_510", "target": "codeNode_912", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e9", "type": "defaultEdge", "source": "codeNode_912", "target": "agentNode_656", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e10", "type": "defaultEdge", "source": "codeNode_641", "target": "codeNode_536", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e11", "type": "agentLoopEdge", "source": "agentNode_656", "target": "codeNode_326", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Guardrail" } },
  { "id": "e12", "type": "agentLoopEdge", "source": "codeNode_326", "target": "agentNode_656", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Guardrail" } },
  { "id": "e13", "type": "agentLoopEdge", "source": "agentNode_656", "target": "apiNode_365", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Fact Lookup" } },
  { "id": "e14", "type": "agentLoopEdge", "source": "apiNode_365", "target": "agentNode_656", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Fact Lookup" } },
  { "id": "e15", "type": "agentLoopEdge", "source": "agentNode_656", "target": "codeNode_718", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Research & Generate" } },
  { "id": "e16", "type": "defaultEdge", "source": "codeNode_718", "target": "codeNode_729", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e17", "type": "agentLoopEdge", "source": "codeNode_729", "target": "agentNode_656", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Research & Generate" } },
  { "id": "e18", "type": "agentLoopEdge", "source": "agentNode_656", "target": "LLMNode_128", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Research & Generate" } },
  { "id": "e19", "type": "agentLoopEdge", "source": "LLMNode_128", "target": "agentNode_656", "sourceHandle": "bottom", "targetHandle": "top", "data": { "branchName": "Research & Generate" } },
  { "id": "e20", "type": "agentLoopEdge", "source": "agentNode_656", "target": "agentLoopEndNode_742", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e21", "type": "defaultEdge", "source": "agentLoopEndNode_742", "target": "codeNode_536", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e22", "type": "defaultEdge", "source": "codeNode_536", "target": "responseNode_1", "sourceHandle": "bottom", "targetHandle": "top" },
  { "id": "e23", "type": "responseEdge", "source": "triggerNode_1", "target": "responseNode_1", "sourceHandle": "to-response", "targetHandle": "from-trigger", "invisible": true }
  ];

export default { meta, inputs, references, nodes, edges };

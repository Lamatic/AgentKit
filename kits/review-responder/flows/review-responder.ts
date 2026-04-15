/*
 * # Review Responder
 * A flow that accepts an inbound review via API, classifies its sentiment, drafts a tailored response, and returns an email-ready payload as the entry point for the wider review-handling agent system.
 *
 * ## Purpose
 * This flow is responsible for turning raw customer feedback into a usable response artifact with minimal operator effort. It handles the core sub-task of review triage and drafting: receive review text, use an LLM to interpret it, branch the workflow based on the detected category, and produce a response suitable for customer communication. In practice, this reduces the manual work required to inspect reviews one by one and ensures that replies are generated consistently.
 *
 * The outcome of the flow is an API response containing an `email` field derived from the downstream code packaging step. That outcome matters because it gives support, success, or operations systems a ready-to-consume reply payload that can be shown to an agent, stored in a CRM, or sent through a separate delivery system. The flow therefore converts unstructured feedback into an actionable, downstream-friendly result.
 *
 * Within the broader agent pipeline, this flow is the entry-point execution path rather than a mid-pipeline helper. Per the parent agent context, it sits between inbound operational systems and whatever human review, CRM, or outbound email automation may follow. Conceptually, it combines lightweight analysis and synthesis in one pass: it first interprets the review, then generates a response strategy, then normalizes the result for callers.
 *
 * ## When To Use
 * - Use when a support or operations system receives a customer review and needs an immediate AI-generated reply draft.
 * - Use when the input is primarily unstructured review or feedback text that must be classified before a response can be written.
 * - Use when you want a single API-call workflow that both analyzes sentiment and produces a customer-facing response.
 * - Use when downstream systems expect a packaged response payload rather than raw model output.
 * - Use when teams need a consistent first-pass reply for positive versus negative customer feedback.
 *
 * ## When Not To Use
 * - Do not use when the input is not a customer review or feedback message, such as a structured support ticket, order event, or internal note.
 * - Do not use when a human-only approval process is required before any draft text is created.
 * - Do not use when the caller needs direct email delivery; this flow only returns a response payload and does not send mail itself.
 * - Do not use when the deployment has not configured the underlying LLM model access required by the `Generate Text` nodes.
 * - Do not use when the upstream system cannot provide the review content needed for sentiment analysis.
 * - Do not use for multi-step knowledge retrieval or tool-augmented resolution workflows; this flow is a compact classify-and-draft path, not a research or case-resolution pipeline.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | Request body / GraphQL payload | object | Yes | The inbound API request handled by the `API Request` trigger. The exact schema is not declared in the flow source, but it is expected to contain the customer review text the LLM can analyze. |
 * | `reviewText` | string | Effectively yes | The customer review or feedback text to classify and respond to. This field is not explicitly declared in `inputs`, but it is the core conceptual input described by the flow README and parent agent context. |
 * | `customerName` | string | No | Optional personalization context if your deployed GraphQL schema supports it. |
 * | `productOrService` | string | No | Optional grounding context to make the response more specific. |
 * | `companyName` | string | No | Optional brand context to shape tone and wording. |
 * | `contactEmail` | string | No | Optional caller metadata if the invoking system wants to associate the generated reply with a destination contact. |
 *
 * The flow source defines no formal `inputs` object and the trigger's `advance_schema` is empty, so input validation is largely implicit and deployment-specific. In practice, the caller should provide clear natural-language review text. If optional fields are supported in your GraphQL schema, they should be plain strings. Extremely short, empty, or ambiguous review content may reduce classification quality and response usefulness.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `email` | any | The final value produced by `codeNode_252.output` and returned by the `API Response` node as the flow's packaged reply payload. |
 *
 * The response is returned as a structured API object with a single top-level `email` field. The exact internal shape of `email` depends on the logic in the referenced code script, but the intended meaning is an email-ready response artifact derived from one of the generation branches. Callers should treat it as the canonical output of the flow rather than depending on intermediate LLM node responses.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow invoked directly through the `API Request` GraphQL trigger.
 * - The only prerequisite is that the calling system must supply the review payload expected by the flow's deployed API schema.
 *
 * ### Downstream Flows
 * - No explicit downstream Lamatic flows are defined in the source.
 * - Operationally, the output can be consumed by external systems such as CRM workflows, human review queues, or email automation services that read the returned `email` field.
 *
 * ### External Services
 * - GraphQL API trigger/runtime — receives the inbound invocation and returns the flow response — required credential or environment variable depends on the Lamatic deployment environment
 * - Configured LLM provider from `@model-configs/review-responder_generate-text.ts` — used by all `Generate Text` nodes for classification and response generation — provider-specific model credentials required by the configured model
 * - Script runtime for `@scripts/review-responder_code.ts` — used to normalize or package generated content before response — no standalone third-party credential implied by the flow source
 *
 * ### Environment Variables
 * - Provider-specific LLM credential variables — enable model access for the `Generate Text` nodes `LLMNode_773`, `LLMNode_263`, and `LLMNode_704`
 * - Lamatic runtime/API configuration variables — support execution of the `API Request` and `API Response` nodes `triggerNode_1` and `graphqlResponseNode_617`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the inbound GraphQL request and starts the flow in realtime mode. The flow source does not define a strict schema here, so this node acts as the entry point that exposes review data from the caller to downstream nodes.
 *
 * 2. `Generate Text` (`LLMNode_773`) runs first against the inbound review payload using the shared system prompt `@prompts/review-responder_generate-text_system.md` and shared model configuration `@model-configs/review-responder_generate-text.ts`. In this flow, this first LLM step functions as the initial analysis/classification stage whose output is used for branching.
 *
 * 3. `Condition` (`conditionNode_550`) evaluates the preceding model result and routes execution down one of two paths. The configured explicit branch checks whether `{{LLMNode_312.output.generatedResponse}}` equals `product`. Although this variable reference appears inconsistent with the actual node IDs in the flow, the intended behavior is clearly conditional routing based on an LLM-produced label. If the condition matches, the flow takes the first generation branch; otherwise it falls back to the `Else` branch.
 *
 * 4. `Generate Text` (`LLMNode_263`) executes on the first branch selected by the condition. It uses the same prompt and model configuration as the other LLM nodes, so in practice this node appears to generate one variant of the customer response tailored to the condition-matched review class.
 *
 * 5. `Generate Text` (`LLMNode_704`) executes on the alternative branch when the condition does not match. Like the first branch node, it uses the same prompt and model configuration, but operationally it represents the alternate response strategy for reviews that fall into the other category.
 *
 * 6. `Code` (`codeNode_252`) receives the output from whichever branch completed and applies the logic in `@scripts/review-responder_code.ts`. This step is where the flow packages, reformats, or normalizes the generated response into the final payload expected by the API response node.
 *
 * 7. `API Response` (`graphqlResponseNode`) returns the final result to the caller. Its output mapping sets `email` to `{{codeNode_252.output}}`, making the code step's result the canonical public output of the flow.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | API call succeeds but `email` is empty or unusable | The review text was empty, too vague, or the code step received incomplete generation output | Validate that the caller sends meaningful review content and inspect `@scripts/review-responder_code.ts` to confirm it handles empty branch outputs safely |
 * | Flow fails during an LLM step | Missing or invalid model provider credentials in the environment used by `@model-configs/review-responder_generate-text.ts` | Configure the required provider API keys or model access settings for the deployed Lamatic environment |
 * | Branching behaves unexpectedly or always falls through to `Else` | The condition references `{{LLMNode_312.output.generatedResponse}}`, which does not match any node ID present in the flow source | Correct the condition to reference the actual upstream LLM node output, then retest both branches |
 * | Returned response does not match expected sentiment path | The classification output label does not align with the condition's expected literal value `product` | Review the system prompt and branch condition together so the classifier emits values that the condition node actually tests |
 * | Trigger invocation cannot parse the request correctly | The deployed GraphQL schema is undefined in the source and the caller sent malformed or unexpected input | Define and document the GraphQL request shape in deployment, then validate incoming payloads before invoking the flow |
 * | Downstream system cannot use the `email` field reliably | The code step may return a shape different from what the consuming system expects | Standardize the output contract in `@scripts/review-responder_code.ts` and document the exact structure returned under `email` |
 * | Flow cannot run in a chained environment | An upstream orchestrator assumes another preparatory flow has already normalized the review data, but this flow was invoked directly with raw or incompatible payloads | Ensure the invoking system passes the review text in the expected format or add a preprocessing step before this flow |
 *
 * ## Notes
 * - The flow metadata and README describe sentiment classification and personalized response generation, but the condition currently checks for the literal value `product`, which suggests either a configuration error or stale branch logic.
 * - All three `Generate Text` nodes use the same prompt and model configuration reference. That is valid, but it means prompt behavior must be carefully designed to support both classification and branch-specific drafting unless the model config injects different message context per node.
 * - The trigger schema is blank in source, so this flow should be treated as deployment-sensitive: the exact request contract must be confirmed in the published API before external systems integrate against it.
 * - The response mapping exposes only the code node's output. Intermediate analysis values are not returned unless the code script explicitly preserves them.
 */

// Flow: review-responder

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Review Responder",
  "description": "This AI-powered review analysis and response system automatically classifies customer reviews, analyzes sentiment, and generates personalized email responses tailored to your needs.",
  "tags": [
    "🚀 Startup",
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/review-responder",
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
    "review_responder_generate_text_system": "@prompts/review-responder_generate-text_system.md"
  },
  "scripts": {
    "review_responder_code": "@scripts/review-responder_code.ts"
  },
  "modelConfigs": {
    "review_responder_generate_text": "@model-configs/review-responder_generate-text.ts"
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
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_773",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/review-responder_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/review-responder_generate-text.ts",
        "messages": "@model-configs/review-responder_generate-text.ts",
        "generativeModelName": "@model-configs/review-responder_generate-text.ts"
      }
    }
  },
  {
    "id": "conditionNode_550",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_625-addNode_150",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \" {{LLMNode_312.output.generatedResponse}}\",\n      \"operator\": \"==\",\n      \"value\": \"product\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_625-addNode_466",
            "condition": {}
          }
        ]
      }
    }
  },
  {
    "id": "LLMNode_263",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/review-responder_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/review-responder_generate-text.ts",
        "messages": "@model-configs/review-responder_generate-text.ts",
        "generativeModelName": "@model-configs/review-responder_generate-text.ts"
      }
    }
  },
  {
    "id": "LLMNode_704",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/review-responder_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/review-responder_generate-text.ts",
        "messages": "@model-configs/review-responder_generate-text.ts",
        "generativeModelName": "@model-configs/review-responder_generate-text.ts"
      }
    }
  },
  {
    "id": "codeNode_252",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/review-responder_code.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_617",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"email\": \"{{codeNode_252.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_773",
    "source": "triggerNode_1",
    "target": "LLMNode_773",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_773-conditionNode_550",
    "source": "LLMNode_773",
    "target": "conditionNode_550",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_625-addNode_150",
    "source": "conditionNode_550",
    "target": "LLMNode_263",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_625-addNode_466",
    "source": "conditionNode_550",
    "target": "LLMNode_704",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_263-codeNode_252",
    "source": "LLMNode_263",
    "target": "codeNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_704-codeNode_252",
    "source": "LLMNode_704",
    "target": "codeNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_252-graphqlResponseNode_617",
    "source": "codeNode_252",
    "target": "graphqlResponseNode_617",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_617",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_617",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

/*
 * # Forge Contract
 * Generates a full 13-section services agreement based on project details, confirmed pricing, and the freelancer's chosen governing law.
 *
 * ## Purpose
 * This flow is the primary document-generation engine for Forge. It runs in Step 4 of the wizard, after the freelancer has confirmed their pricing and selected a governing law, and its job is to produce a complete, professional services agreement without requiring the freelancer to draft a single clause. Rather than using a fixed template, Forge delegates the entire generation to an LLM that has been given the full project context — parties, scope, deliverables, timeline, payment terms, and governing law — and instructed to produce a structured, legally coherent 13-section contract that reflects those specifics.
 *
 * The output is a JSON object where each key is a section identifier and each value contains a `heading` and `body`. This structure allows the Forge app to render the contract as a clean, section-by-section document rather than a wall of undifferentiated prose. The rendered contract is displayed on the preview page where the freelancer can review it, apply their digital signature, and export it as a PDF.
 *
 * Within the broader four-flow Forge pipeline, this is the third AI call and the one that produces the highest-value output. It depends on `forge-pricing` for confirmed payment terms and on `forge-tradeoff` for the chosen jurisdiction. It runs in parallel with `forge-invoice` in Step 4, since both documents share the same input payload but produce independent outputs.
 *
 * ## When To Use
 * - Use when the freelancer has confirmed pricing, selected a governing law, and is ready to generate their contract.
 * - Use when a full 13-section services agreement is needed for a freelance project with named parties on both sides.
 * - Use when `chosen_governing_law` is set and the contract's dispute resolution and jurisdiction clauses should reflect that choice.
 * - Use when the project details are sufficiently complete: parties, project scope, deliverables, timeline, and payment terms are all known.
 *
 * ## When Not To Use
 * - Do not use when `chosen_governing_law` is missing; the governing law and dispute resolution sections will be incomplete or inconsistent.
 * - Do not use as a legally binding document without independent review; the output is AI-generated and should be reviewed by the parties before signing.
 * - Do not use when the project details are vague or incomplete; the LLM requires enough context to generate meaningful clause bodies rather than placeholder text.
 * - Do not use when the generative model is not configured; the flow will return an empty response with no fallback generation logic.
 * - Do not use in sectors requiring regulated contract formats such as employment, real estate, or financial services; this flow is designed for freelance services agreements only.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `freelancer_name` | `string` | Yes | The freelancer's full name as it will appear in the agreement. |
 * | `freelancer_country` | `string` | Yes | The country where the freelancer is based. |
 * | `freelancer_payment_method` | `string` | Yes | The freelancer's preferred payment method, used to populate the payment instructions clause. |
 * | `freelancer_primary_concern` | `string` | Yes | The freelancer's stated priority, used to weight protective clauses such as late payment penalties or IP assignment. |
 * | `client_name` | `string` | Yes | The client's full name or company name as it will appear in the agreement. |
 * | `client_country` | `string` | Yes | The country where the client is based. |
 * | `client_type` | `string` | Yes | Whether the client is an individual or a registered business entity. |
 * | `project_title` | `string` | Yes | The name of the project, used as the agreement title and throughout the document. |
 * | `project_description` | `string` | Yes | A plain-language description of the scope of work. |
 * | `deliverables` | `string` | Yes | The specific outputs the freelancer will produce, used to populate the scope of work clause. |
 * | `timeline_start` | `string` | Yes | The agreed project start date. |
 * | `timeline_end` | `string` | Yes | The agreed project completion date or deadline. |
 * | `payment_amount` | `string` | Yes | The total confirmed payment amount. |
 * | `payment_currency` | `string` | Yes | The currency of the agreed payment. |
 * | `payment_structure` | `string` | Yes | The payment schedule, used to populate the payment terms clause. |
 * | `work_type` | `string` | Yes | The engagement type, used to set the correct contract framing. |
 * | `chosen_governing_law` | `string` | Yes | The jurisdiction selected by the freelancer in Step 3, used to populate the governing law and dispute resolution clauses. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `contract` | `string` | A JSON-formatted string representing a 13-section services agreement. Each key is a section slug and each value is an object containing `heading` and `body` strings. |
 *
 * The `contract` field is returned as a raw LLM-generated string. The Forge app parses it as JSON on the client side and renders each section in order. The 13 sections are: parties, recitals, scope of work, timeline, payment terms, intellectual property, confidentiality, revision policy, late payment, termination, governing law, dispute resolution, and signatures. If the model omits a section or produces invalid JSON, the preview renders only the sections that parsed successfully.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `forge-pricing` — its confirmed output (payment amount, currency, payment structure) is passed directly into this flow's trigger payload.
 * - `forge-tradeoff` — its output determines `chosen_governing_law`, which is a required input for this flow.
 *
 * ### Downstream Flows
 * - None. This is a terminal generation flow. Its output is consumed by the Forge app's contract preview page and is not forwarded to any further Lamatic flow.
 *
 * ### External Services
 * - Text generation model provider — powers `LLMNode_contract` to generate the full services agreement from structured inputs — requires a configured generative model selected via the `generativeModelName` input.
 *
 * ### Environment Variables
 * - Model provider credentials — authenticate the selected text generation model — configured through the Lamatic platform's model settings and referenced via `@model-configs/forge-contract_llmnode-contract_generative-model-name.ts`.
 * - `FLOW_ID_CONTRACT` — the Lamatic flow ID for this flow — used by the Forge Next.js app's `/api/flow` proxy route to route requests to the correct Lamatic endpoint.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the inbound payload containing all seventeen project, party, and legal context fields assembled by the Forge wizard across Steps 1, 2, and 3. This is the external entry point for the flow.
 *
 * 2. `Contract Generation Agent` (`LLMNode_contract`) receives all trigger fields and processes them using a dedicated system prompt that instructs the model to act as a professional contract drafter, and a user prompt that interpolates every project-specific field into the generation request. The model produces a 13-section JSON object where each section has a `heading` and a `body` tailored to the specific parties, project scope, payment terms, and chosen governing law provided.
 *
 * 3. `API Response` (`graphqlResponseNode`) maps the LLM output to the response field `contract` and returns it to the Forge app's server-side proxy, which stores the contract in the session and navigates the user to the contract preview page.
 */
// Flow: forge-contract

// -- Meta --
export const meta = {
  "name": "Forge Contract",
  "description": "Generates a full 13-section services agreement based on project details, confirmed pricing, and chosen governing law.",
  "tags": ["legal", "contract", "generative"],
  "testInput": "{\"project_title\":\"E-commerce Website\",\"freelancer_name\":\"John Doe\",\"client_name\":\"Acme Corp\",\"payment_amount\":\"5000\",\"payment_currency\":\"USD\",\"chosen_governing_law\":\"English Law\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/forge/flows/forge-contract",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_contract": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "forge_contract_llmnode_contract_system_0": "@prompts/forge-contract_llmnode-contract_system_0.md",
    "forge_contract_llmnode_contract_user_1": "@prompts/forge-contract_llmnode-contract_user_1.md"
  },
  "modelConfigs": {
    "forge_contract_llmnode_contract_generative_model_name": "@model-configs/forge-contract_llmnode-contract_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
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
        "advance_schema": "{\n  \"freelancer_name\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"freelancer_payment_method\": \"string\",\n  \"freelancer_primary_concern\": \"string\",\n  \"client_name\": \"string\",\n  \"client_country\": \"string\",\n  \"client_type\": \"string\",\n  \"project_title\": \"string\",\n  \"project_description\": \"string\",\n  \"deliverables\": \"string\",\n  \"timeline_start\": \"string\",\n  \"timeline_end\": \"string\",\n  \"payment_amount\": \"string\",\n  \"payment_currency\": \"string\",\n  \"payment_structure\": \"string\",\n  \"work_type\": \"string\",\n  \"chosen_governing_law\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_contract",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_contract",
        "tools": [],
        "prompts": [
          {
            "id": "contract-sys-001",
            "role": "system",
            "content": "@prompts/forge-contract_llmnode-contract_system_0.md"
          },
          {
            "id": "contract-user-001",
            "role": "user",
            "content": "@prompts/forge-contract_llmnode-contract_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Contract Generation Agent",
        "generativeModelName": "@model-configs/forge-contract_llmnode-contract_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_002",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"contract\": \"{{LLMNode_contract.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_contract",
    "source": "triggerNode_1",
    "target": "LLMNode_contract",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_contract-graphqlResponseNode_002",
    "source": "LLMNode_contract",
    "target": "graphqlResponseNode_002",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_002",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_002",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

/*
 * # Forge Tradeoff
 * Analyses both parties' countries and the freelancer's primary concern to provide 3 governing law options with pros, cons, and a tailored recommendation.
 *
 * ## Purpose
 * This flow is the legal-intelligence engine for Forge. It sits between the pricing confirmation step and document generation, and its purpose is to spare the freelancer from having to research cross-border contract law independently. Rather than defaulting to an arbitrary jurisdiction or leaving the governing law clause blank, Forge calls this flow to generate three concrete governing law options — each with trade-offs and a plain-language explanation — and then highlights which option best fits the freelancer's stated primary concern.
 *
 * The output is a structured JSON array of options surfaced to the freelancer in the Step 3 governing law screen. Each option includes a jurisdiction name, a one-sentence rationale, a list of pros, a list of cons, and a boolean flag indicating whether it is the recommended choice. The freelancer selects one and that choice is forwarded as `chosen_governing_law` into the downstream contract generation flow.
 *
 * Within the broader four-flow Forge pipeline, this is the second AI call and the only one that reasons about legal context rather than financial or documentary content. Its output is consumed exclusively by `forge-contract`; it has no effect on the invoice. The three options it surfaces are calibrated specifically to the freelancer-client country pairing and the freelancer's stated primary concern, which means the same two countries can yield different recommendations depending on whether the freelancer prioritises payment enforcement, IP ownership, or dispute speed.
 *
 * ## When To Use
 * - Use when both `freelancer_country` and `client_country` are known and the freelancer needs help choosing a governing law for a cross-border contract.
 * - Use when the freelancer has stated a primary concern such as getting paid on time, protecting IP, or minimising legal costs, and the recommendation should be weighted toward that concern.
 * - Use when the downstream `forge-contract` flow requires a `chosen_governing_law` field and the freelancer has not yet made a selection.
 * - Use when the project involves parties in different jurisdictions where default local law would be ambiguous or disadvantageous to the freelancer.
 *
 * ## When Not To Use
 * - Do not use when both parties are in the same country and the governing law is obvious or already agreed.
 * - Do not use when `freelancer_primary_concern` is missing; the LLM will generate generic options rather than a concern-weighted recommendation.
 * - Do not use as a substitute for qualified legal advice; the output is a decision-support tool for non-lawyers, not a legal opinion.
 * - Do not use when the generative model is not configured; the flow will return an empty response without a valid model.
 * - Do not use in jurisdictions where LLM-generated legal content is prohibited or requires licensed attorney review before use.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `freelancer_name` | `string` | Yes | The freelancer's full name, used to personalise the analysis context. |
 * | `freelancer_country` | `string` | Yes | The country where the freelancer is based, used to anchor jurisdictional options. |
 * | `freelancer_payment_method` | `string` | Yes | How the freelancer expects to receive payment, e.g. bank transfer, PayPal, crypto. |
 * | `freelancer_primary_concern` | `string` | Yes | The freelancer's stated priority, e.g. getting paid on time, protecting IP, fast dispute resolution. |
 * | `client_name` | `string` | Yes | The client's full name or company name. |
 * | `client_country` | `string` | Yes | The country where the client is based. |
 * | `client_type` | `string` | Yes | Whether the client is an individual or a business entity. |
 * | `project_title` | `string` | Yes | The name of the project being contracted. |
 * | `project_description` | `string` | Yes | A plain-language summary of the scope of work. |
 * | `deliverables` | `string` | Yes | The list of outputs the freelancer will produce. |
 * | `timeline_start` | `string` | Yes | The project start date. |
 * | `timeline_end` | `string` | Yes | The project end date or deadline. |
 * | `payment_amount` | `string` | Yes | The total confirmed payment amount from the pricing step. |
 * | `payment_currency` | `string` | Yes | The currency of the confirmed payment. |
 * | `payment_structure` | `string` | Yes | The payment schedule, e.g. milestone-based, upfront, or on completion. |
 * | `work_type` | `string` | Yes | The engagement type, e.g. project-based or retainer. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `options` | `string` | A JSON-formatted string containing an array of three governing law options, each with name, rationale, pros, cons, and a recommended flag. |
 *
 * The `options` field is returned as a raw LLM-generated string. The Forge app parses it as JSON and renders each option as a selectable card in the Step 3 governing law screen. The recommended option is visually highlighted. The freelancer's final selection is stored in session state and forwarded as `chosen_governing_law` to `forge-contract`.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `forge-pricing` — its confirmed output (payment amount, currency, line items) is included in this flow's trigger payload as context for the governing law analysis.
 *
 * ### Downstream Flows
 * - `forge-contract` — receives `chosen_governing_law` from this step as one of its required generation inputs.
 * - `forge-invoice` — not directly affected by governing law; runs in parallel with `forge-contract` in Step 4.
 *
 * ### External Services
 * - Text generation model provider — powers `LLMNode_tradeoff` to reason about jurisdictional trade-offs and return structured options — requires a configured generative model selected via the `generativeModelName` input.
 *
 * ### Environment Variables
 * - Model provider credentials — authenticate the selected text generation model — configured through the Lamatic platform's model settings and referenced via `@model-configs/forge-tradeoff_llmnode-tradeoff_generative-model-name.ts`.
 * - `FLOW_ID_TRADEOFF` — the Lamatic flow ID for this flow — used by the Forge Next.js app's `/api/flow` proxy route to route requests to the correct Lamatic endpoint.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the inbound payload containing all sixteen project-context fields assembled by the Forge wizard from Steps 1 and 2. This is the external entry point for the flow and provides the full project and party context the LLM needs to make jurisdiction-specific recommendations.
 *
 * 2. `Governing Law Tradeoff Agent` (`LLMNode_tradeoff`) receives all trigger fields and processes them using a dedicated system prompt that instructs the model to reason as a cross-border contract specialist, and a user prompt that interpolates the specific party details, project context, and freelancer concern into the analysis. The model returns a JSON array of exactly three governing law options, each with a jurisdiction name, rationale, pros, cons, and a recommendation flag that reflects the freelancer's stated primary concern.
 *
 * 3. `API Response` (`graphqlResponseNode`) maps the LLM output to the response field `options` and returns it to the Forge app's server-side proxy, which forwards it to the Step 3 governing law selection component for the freelancer to review and choose from.
 */
// Flow: forge-tradeoff

// -- Meta --
export const meta = {
  "name": "Forge Tradeoff",
  "description": "Analyses both parties' countries and the freelancer's primary concern to provide 3 governing law options with pros, cons, and a recommendation.",
  "tags": ["legal", "cross-border", "recommendations"],
  "testInput": "{\"freelancer_country\":\"Nigeria\",\"client_country\":\"United Kingdom\",\"freelancer_primary_concern\":\"Getting paid on time\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/forge/flows/forge-tradeoff",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_tradeoff": [
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
    "forge_tradeoff_llmnode_tradeoff_system_0": "@prompts/forge-tradeoff_llmnode-tradeoff_system_0.md",
    "forge_tradeoff_llmnode_tradeoff_user_1": "@prompts/forge-tradeoff_llmnode-tradeoff_user_1.md"
  },
  "modelConfigs": {
    "forge_tradeoff_llmnode_tradeoff_generative_model_name": "@model-configs/forge-tradeoff_llmnode-tradeoff_generative-model-name.ts"
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
        "advance_schema": "{\n  \"freelancer_name\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"freelancer_payment_method\": \"string\",\n  \"freelancer_primary_concern\": \"string\",\n  \"client_name\": \"string\",\n  \"client_country\": \"string\",\n  \"client_type\": \"string\",\n  \"project_title\": \"string\",\n  \"project_description\": \"string\",\n  \"deliverables\": \"string\",\n  \"timeline_start\": \"string\",\n  \"timeline_end\": \"string\",\n  \"payment_amount\": \"string\",\n  \"payment_currency\": \"string\",\n  \"payment_structure\": \"string\",\n  \"work_type\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_tradeoff",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_tradeoff",
        "tools": [],
        "prompts": [
          {
            "id": "tradeoff-sys-001",
            "role": "system",
            "content": "@prompts/forge-tradeoff_llmnode-tradeoff_system_0.md"
          },
          {
            "id": "tradeoff-user-001",
            "role": "user",
            "content": "@prompts/forge-tradeoff_llmnode-tradeoff_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Governing Law Tradeoff Agent",
        "generativeModelName": "@model-configs/forge-tradeoff_llmnode-tradeoff_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_001",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"options\": \"{{LLMNode_tradeoff.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_tradeoff",
    "source": "triggerNode_1",
    "target": "LLMNode_tradeoff",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_tradeoff-graphqlResponseNode_001",
    "source": "LLMNode_tradeoff",
    "target": "graphqlResponseNode_001",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_001",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_001",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

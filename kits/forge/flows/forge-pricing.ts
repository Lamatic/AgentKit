/*
 * # Forge Pricing
 * Analyses the freelancer's field, experience level, country, and deliverables against market data to return AI-calibrated per-item pricing with market context.
 *
 * ## Purpose
 * This flow is the market-intelligence engine for Forge. It accepts structured project details submitted by the freelancer in Step 1 of the wizard and converts them into a realistic, contextualised pricing recommendation. Rather than asking the freelancer to guess their rate, Forge delegates that reasoning to an LLM that has been prompted to reason like a market analyst: it considers the freelancer's field, seniority, country-of-operation, client geography, payment structure preference, and the specific deliverables listed, then returns itemised pricing with per-unit rates, quantities, and a total.
 *
 * The outcome is a structured JSON pricing payload that the Forge app parses and surfaces to the freelancer as an editable suggestion in the Step 2 pricing review screen. The freelancer can accept, adjust, or override the suggestions before proceeding. This flow exists so that freelancers who are uncertain about market rates — especially those operating across currency or geography gaps — have an evidence-anchored starting point rather than an arbitrary number.
 *
 * Within the broader four-flow Forge pipeline, this is the first AI call made after the user completes their project details. The pricing output feeds directly into the contract and invoice generation flows downstream: the confirmed line items, total, and currency chosen here are passed forward as context to `forge-contract` and `forge-invoice` in Steps 3 and 4 of the wizard.
 *
 * ## When To Use
 * - Use when a freelancer has completed project setup and needs a market-calibrated rate recommendation for their specific deliverables.
 * - Use when the request includes a defined field, experience level, country context, and at least one deliverable.
 * - Use when the goal is to produce itemised per-deliverable pricing rather than a single blended rate.
 * - Use when the downstream contract and invoice flows will consume the confirmed pricing output.
 * - Use when the freelancer operates in a different country from the client and needs currency-aware rate guidance.
 *
 * ## When Not To Use
 * - Do not use when `deliverables` is empty or missing; the LLM cannot generate line items without at least one deliverable description.
 * - Do not use when a fixed price has already been agreed with the client and no AI suggestion is needed.
 * - Do not use when the caller only needs a blended project total without itemised breakdown; the output schema is always itemised.
 * - Do not use when the generative model is not configured; the flow has no fallback pricing logic and will return an empty response without a valid model.
 * - Do not use as a real-time quoting API in a high-volume or automated pipeline without rate-limiting; this flow is designed for single-session interactive use.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `work_type` | `string` | Yes | The nature of the engagement, e.g. project-based, retainer, or hourly. |
 * | `field` | `string` | Yes | The freelancer's professional domain, e.g. Software Engineering, UI/UX Design, Copywriting. |
 * | `experience_level` | `string` | Yes | The freelancer's self-reported seniority, e.g. Junior, Mid-level, Senior, Expert. |
 * | `years_of_experience` | `string` | Yes | Number of years the freelancer has worked in their field. |
 * | `deliverables` | `string` | Yes | Newline-separated list of specific outputs the freelancer will produce. |
 * | `payment_structure` | `string` | Yes | Whether payment is milestone-based, upfront, or on completion. |
 * | `currency` | `string` | Yes | The currency the freelancer wants to quote in, e.g. USD, GBP, NGN. |
 * | `freelancer_country` | `string` | Yes | The country where the freelancer is based, used for regional rate calibration. |
 * | `client_country` | `string` | Yes | The country where the client is based, used to contextualise cross-border rate expectations. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `pricing` | `string` | A JSON-formatted string containing itemised line items, each with description, quantity, rate, amount, and currency, plus a total and market context note. |
 *
 * The `pricing` field is returned as a raw LLM-generated string. The Forge app parses it as JSON on the client side. The expected schema mirrors the invoice line-item format so the confirmed values can be forwarded directly to `forge-invoice` without transformation. If the model cannot produce a valid JSON structure, the app falls back to the error state and prompts the user to retry.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is the first flow called in the Forge wizard. It is triggered directly by the app's server-side proxy after the user completes Step 1.
 *
 * ### Downstream Flows
 * - `forge-tradeoff` — receives the confirmed pricing context as part of the full project payload in Step 3.
 * - `forge-contract` — receives the confirmed line items, total, and currency as contract payment terms in Step 4.
 * - `forge-invoice` — receives the confirmed line items directly to populate the invoice document in Step 4.
 *
 * ### External Services
 * - Text generation model provider — powers `LLMNode_pricing` to analyse inputs and return structured pricing — requires a configured generative model selected via the `generativeModelName` input.
 *
 * ### Environment Variables
 * - Model provider credentials — authenticate the selected text generation model — configured through the Lamatic platform's model settings and referenced via `@model-configs/forge-pricing_llmnode-pricing_generative-model-name.ts`.
 * - `FLOW_ID_PRICING` — the Lamatic flow ID for this flow — used by the Forge Next.js app's `/api/flow` proxy route to route requests to the correct Lamatic endpoint.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the inbound payload containing all nine project-detail fields from the Forge wizard's Step 1 form. This is the external entry point for the flow and establishes the full request context passed to the LLM.
 *
 * 2. `Pricing Suggestion Agent` (`LLMNode_pricing`) receives all nine trigger fields and processes them using a dedicated system prompt that instructs the model to reason as a market-aware pricing analyst, and a user prompt that interpolates the specific field values into a structured analysis request. The model returns a JSON-formatted pricing recommendation with itemised line items, per-unit rates, quantities, amounts, and a plain-language market context note that helps the freelancer understand why those rates were suggested.
 *
 * 3. `API Response` (`graphqlResponseNode`) maps the LLM output to the response field `pricing` and returns it to the Forge app's server-side proxy, which forwards it to the Step 2 pricing review component for the freelancer to inspect and confirm.
 */
// Flow: forge-pricing

// -- Meta --
export const meta = {
  "name": "Forge Pricing",
  "description": "Analyses the freelancer's field, experience level, country, and deliverables against market data to return AI-calibrated per-item pricing with market context.",
  "tags": ["agentic", "pricing", "Market Analysis"],
  "testInput": "{\"work_type\":\"code\",\"field\":\"Software Engineering\",\"experience_level\":\"Senior\",\"years_of_experience\":\"5\",\"deliverables\":\"Landing Page\\nAuth System\\nDatabase Schema\",\"payment_structure\":\"fixed\",\"currency\":\"USD\",\"freelancer_country\":\"Nigeria\",\"client_country\":\"United Kingdom\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/forge/flows/forge-pricing",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_pricing": [
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
    "forge_pricing_llmnode_pricing_system_0": "@prompts/forge-pricing_llmnode-pricing_system_0.md",
    "forge_pricing_llmnode_pricing_user_1": "@prompts/forge-pricing_llmnode-pricing_user_1.md"
  },
  "modelConfigs": {
    "forge_pricing_llmnode_pricing_generative_model_name": "@model-configs/forge-pricing_llmnode-pricing_generative-model-name.ts"
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
        "advance_schema": "{\n  \"work_type\": \"string\",\n  \"field\": \"string\",\n  \"experience_level\": \"string\",\n  \"years_of_experience\": \"string\",\n  \"deliverables\": \"string\",\n  \"payment_structure\": \"string\",\n  \"currency\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"client_country\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_pricing",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_pricing",
        "tools": [],
        "prompts": [
          {
            "id": "pricing-sys-001",
            "role": "system",
            "content": "@prompts/forge-pricing_llmnode-pricing_system_0.md"
          },
          {
            "id": "pricing-user-001",
            "role": "user",
            "content": "@prompts/forge-pricing_llmnode-pricing_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Pricing Suggestion Agent",
        "generativeModelName": "@model-configs/forge-pricing_llmnode-pricing_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_004",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"pricing\": \"{{LLMNode_pricing.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_pricing",
    "source": "triggerNode_1",
    "target": "LLMNode_pricing",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_pricing-graphqlResponseNode_004",
    "source": "LLMNode_pricing",
    "target": "graphqlResponseNode_004",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_004",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_004",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

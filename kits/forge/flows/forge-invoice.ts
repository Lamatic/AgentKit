/*
 * # Forge Invoice
 * Generates a professional invoice with confirmed line items, freelancer and client details, and structured payment instructions.
 *
 * ## Purpose
 * This flow is the invoicing engine for Forge. It runs alongside `forge-contract` in Step 4 of the wizard, taking the same confirmed project context and producing a companion financial document that the freelancer can send to the client alongside or instead of the contract. Rather than requiring the freelancer to manually format an invoice, Forge delegates the generation to an LLM that has been given the full billing context — parties, project title, line items, due dates, and payment instructions — and instructed to return a structured, render-ready invoice object.
 *
 * The output is a JSON object shaped to match the `InvoiceData` type consumed by the Forge app's invoice preview component. It includes nested blocks for freelancer details, client details, invoice header metadata, line items with per-unit rates and amounts, totals, payment instructions, and optional notes. This structure allows the app to render a clean, professional invoice document without any post-processing or template merging on the client side.
 *
 * Within the broader four-flow Forge pipeline, this is the fourth and final AI call. It runs in parallel with `forge-contract` in Step 4, since both flows receive the same trigger payload assembled from the prior steps. Unlike the contract, the invoice does not depend on the governing law selection; it is a financial document that reflects the confirmed pricing and party details only. After generation, the freelancer can sign the invoice independently, view it on its own preview page, and export it as a PDF.
 *
 * ## When To Use
 * - Use when the freelancer has confirmed their pricing and is ready to generate a billable invoice for the client.
 * - Use when a fully structured, render-ready invoice is needed with itemised line items, due date, and payment instructions.
 * - Use when the freelancer and client details are complete, including addresses, countries, and email addresses.
 * - Use when the goal is to produce the invoice in parallel with the contract so both documents are ready at the same time.
 * - Use when the downstream invoice preview page needs a populated `InvoiceData` object without any client-side transformation.
 *
 * ## When Not To Use
 * - Do not use when `line_items` is empty or missing; the LLM cannot populate the invoice table without at least one item.
 * - Do not use when `total_amount` is inconsistent with the sum of `line_items`; the LLM will use the provided values as-is and the document may appear incorrect.
 * - Do not use when freelancer or client contact details are incomplete; the invoice header will contain placeholder text that is not suitable for client delivery.
 * - Do not use when the generative model is not configured; the flow will return an empty response with no fallback invoice logic.
 * - Do not use as an official tax document without verification; the output is AI-formatted and may not meet jurisdiction-specific invoicing requirements such as VAT registration numbers or mandatory field formats.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `freelancer_name` | `string` | Yes | The freelancer's full name as it appears on the invoice. |
 * | `freelancer_address` | `string` | Yes | The freelancer's street address or location description. |
 * | `freelancer_country` | `string` | Yes | The freelancer's country of residence. |
 * | `freelancer_email` | `string` | Yes | The freelancer's email address for client correspondence. |
 * | `freelancer_payment_details` | `string` | Yes | The freelancer's payment details, e.g. bank account, PayPal address, or crypto wallet. |
 * | `client_name` | `string` | Yes | The client's full name or company name. |
 * | `client_address` | `string` | Yes | The client's billing address. |
 * | `client_country` | `string` | Yes | The client's country. |
 * | `client_email` | `string` | Yes | The client's email address. |
 * | `invoice_date` | `string` | Yes | The date the invoice is issued, used in the invoice header. |
 * | `due_date` | `string` | Yes | The payment due date, derived from the project timeline or payment structure. |
 * | `project_title` | `string` | Yes | The name of the project being invoiced. |
 * | `line_items` | `string` | Yes | A JSON-formatted string of confirmed line items from the pricing step, each with description, quantity, rate, and amount. |
 * | `currency` | `string` | Yes | The currency symbol or code used across all monetary values in the invoice. |
 * | `total_amount` | `string` | Yes | The total confirmed payment amount. |
 * | `payment_instructions` | `string` | Yes | Instructions for how the client should make payment, e.g. bank transfer details or payment link. |
 * | `notes` | `string` | No | Optional additional notes to include at the bottom of the invoice, e.g. thank-you message or tax disclaimer. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `invoice` | `string` | A JSON-formatted string matching the `InvoiceData` type, containing nested freelancer, client, header, line_items, totals, payment_instructions, and notes fields. |
 *
 * The `invoice` field is returned as a raw LLM-generated string. The Forge app parses it as JSON and passes it directly to the `InvoiceDocument` component for rendering. If the model produces invalid JSON or omits a required nested field, the preview falls back to the error state and prompts the user to retry. The line items in the output are expected to mirror the confirmed pricing from Step 2, with per-item description, quantity, rate, and amount values.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `forge-pricing` — its confirmed output (line items, total, currency) is included in this flow's trigger payload as `line_items`, `total_amount`, and `currency`.
 * - `forge-tradeoff` — not a direct dependency; runs in parallel with this flow in Step 4 and its output affects only `forge-contract`.
 *
 * ### Downstream Flows
 * - None. This is a terminal generation flow. Its output is consumed by the Forge app's invoice preview page and is not forwarded to any further Lamatic flow.
 *
 * ### External Services
 * - Text generation model provider — powers `LLMNode_invoice` to produce the structured invoice JSON from billing inputs — requires a configured generative model selected via the `generativeModelName` input.
 *
 * ### Environment Variables
 * - Model provider credentials — authenticate the selected text generation model — configured through the Lamatic platform's model settings and referenced via `@model-configs/forge-invoice_llmnode-invoice_generative-model-name.ts`.
 * - `FLOW_ID_INVOICE` — the Lamatic flow ID for this flow — used by the Forge Next.js app's `/api/flow` proxy route to route requests to the correct Lamatic endpoint.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives the inbound payload containing all seventeen billing and party fields assembled by the Forge wizard from Steps 1 and 2. This is the external entry point for the flow.
 *
 * 2. `Invoice Generation Agent` (`LLMNode_invoice`) receives all trigger fields and processes them using a dedicated system prompt that instructs the model to act as a professional invoice formatter, and a user prompt that interpolates every billing-specific field into the generation request. The model returns a fully structured `InvoiceData` JSON object with nested blocks for the freelancer, client, header metadata, line items, totals, payment instructions, and optional notes — all ready for direct rendering without transformation.
 *
 * 3. `API Response` (`graphqlResponseNode`) maps the LLM output to the response field `invoice` and returns it to the Forge app's server-side proxy, which stores the invoice in the session and navigates the user to the invoice preview page after the contract preview step.
 */
// Flow: forge-invoice

// -- Meta --
export const meta = {
  "name": "Forge Invoice",
  "description": "Generates a professional invoice with confirmed line items, freelancer/client details, and payment instructions.",
  "tags": ["finance", "invoicing", "generative"],
  "testInput": "{\"project_title\":\"E-commerce Website\",\"freelancer_name\":\"John Doe\",\"client_name\":\"Acme Corp\",\"total_amount\":\"5000\",\"currency\":\"USD\",\"line_items\":\"[{\\\"description\\\":\\\"Development\\\",\\\"amount\\\":5000}]\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/forge/flows/forge-invoice",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_invoice": [
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
    "forge_invoice_llmnode_invoice_system_0": "@prompts/forge-invoice_llmnode-invoice_system_0.md",
    "forge_invoice_llmnode_invoice_user_1": "@prompts/forge-invoice_llmnode-invoice_user_1.md"
  },
  "modelConfigs": {
    "forge_invoice_llmnode_invoice_generative_model_name": "@model-configs/forge-invoice_llmnode-invoice_generative-model-name.ts"
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
        "advance_schema": "{\n  \"freelancer_name\": \"string\",\n  \"freelancer_address\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"freelancer_email\": \"string\",\n  \"freelancer_payment_details\": \"string\",\n  \"client_name\": \"string\",\n  \"client_address\": \"string\",\n  \"client_country\": \"string\",\n  \"client_email\": \"string\",\n  \"invoice_date\": \"string\",\n  \"due_date\": \"string\",\n  \"project_title\": \"string\",\n  \"line_items\": \"string\",\n  \"currency\": \"string\",\n  \"total_amount\": \"string\",\n  \"payment_instructions\": \"string\",\n  \"notes\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_invoice",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_invoice",
        "tools": [],
        "prompts": [
          {
            "id": "invoice-sys-001",
            "role": "system",
            "content": "@prompts/forge-invoice_llmnode-invoice_system_0.md"
          },
          {
            "id": "invoice-user-001",
            "role": "user",
            "content": "@prompts/forge-invoice_llmnode-invoice_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Invoice Generation Agent",
        "generativeModelName": "@model-configs/forge-invoice_llmnode-invoice_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_003",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"invoice\": \"{{LLMNode_invoice.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_invoice",
    "source": "triggerNode_1",
    "target": "LLMNode_invoice",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_invoice-graphqlResponseNode_003",
    "source": "LLMNode_invoice",
    "target": "graphqlResponseNode_003",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_003",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_003",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

/*
 * # Invoice Summariser
 * A GraphQL-invoked entrypoint flow that converts an invoice file into extracted text and returns an LLM-generated structured JSON summary for downstream operational or financial use.
 *
 * ## Purpose
 * This flow is responsible for turning an unstructured invoice document into a predictable, machine-consumable summary. Its specific job is to accept an invoice file reference at an API boundary, extract the document text from the file, and pass that text to an LLM that is instructed to identify key invoice facts such as vendor details, amounts, and due dates.
 *
 * The outcome is a single response field containing the model's generated structured output. That output matters because it gives external applications and automations a normalized representation of invoice data without requiring them to parse PDFs or infer meaning from varied invoice layouts. In practice, this reduces manual review effort and makes it easier to store, validate, or route invoice details into accounting, support, or payment systems.
 *
 * Within the broader agent context, this flow is the canonical entrypoint and the full processing pipeline for this kit. There is no separate retrieval or orchestration stage in front of it inside the project: the caller invokes this flow directly over GraphQL, the flow extracts source text from the supplied file, and the LLM performs the synthesis and structuring step. In a larger chain, this flow would typically sit at the document-ingestion and structured-extraction stage before any downstream validation, approval, or system integration logic.
 *
 * ## When To Use
 * - Use when an external system needs a structured summary of a single invoice document.
 * - Use when the input is a file-based invoice, especially a PDF accessible from a URL provided in the API request.
 * - Use when downstream automation requires normalized invoice facts rather than raw document text.
 * - Use when support, finance operations, or integrations need machine-readable invoice details such as totals, due dates, and vendor information.
 * - Use when this kit is being invoked as the main entrypoint for invoice summarisation over GraphQL.
 *
 * ## When Not To Use
 * - Do not use when the input is not a file or does not provide a usable `url` for the document extractor.
 * - Do not use when the document is not an invoice and you need a different extraction schema or prompt.
 * - Do not use when you need deterministic rule-based parsing of a known invoice template rather than LLM-based extraction.
 * - Do not use when multiple invoices are bundled into one file and you require one normalized record per invoice without pre-splitting.
 * - Do not use when the upstream caller cannot supply an accessible PDF or compatible file for the `Extract from File` node.
 * - Do not use when a sibling flow in another kit is responsible for OCR-heavy ingestion, validation, approval routing, or accounting-system writeback; this flow only performs extraction and summarisation.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `url` | `string` | Yes | File URL supplied in the GraphQL request payload and read from `triggerNode_1.output.url`. This is the invoice document location consumed by the file extraction node. |
 *
 * The flow declares no explicit typed `inputs` object, so the effective trigger contract is inferred from node wiring. The `Extract from File` node expects a valid file URL at `triggerNode_1.output.url`.
 *
 * Input should point to a PDF, as the extractor is configured with `format` set to `pdf`. Best results come from a single invoice per file. Text-based PDFs are the clearest fit; scanned documents may succeed only if the underlying extraction capability can derive usable text. The flow does not show custom validation, file-size guards, or schema enforcement at the trigger layer.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | The generated response from `LLMNode_103.output.generatedResponse`, intended to contain a structured JSON summary of the invoice. |
 *
 * The API response is a single-field object containing `output`. Although the flow is designed to generate structured JSON, the response mapping returns the LLM output as a string, so callers should treat it as model-generated text that is expected to be JSON-shaped rather than as a natively enforced JSON object. Completeness depends on document quality, text extraction quality, and prompt/model behavior.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow for the kit. No other Lamatic flow must run before it.
 *
 * Its only prerequisite is that the external caller provides the invoice document reference expected by the GraphQL trigger, specifically a usable `url` value that the `Extract from File` node can fetch.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are defined in this project.
 *
 * In broader system usage, external applications or automations may consume this flow's `output` field to perform validation, persistence, approval routing, payment processing, or case enrichment.
 *
 * ### External Services
 * - GraphQL API boundary — receives the invocation request and returns the flow response — required credential or environment variable depends on the Lamatic deployment configuration, not declared in this flow file
 * - File extraction service via `extractFromFileNode` — fetches and parses the invoice document from the provided URL — required credential or environment variable not declared in this flow file
 * - Configured LLM via `LLMNode` — generates the structured invoice summary from extracted text using the referenced prompt and model config — required credential or environment variable depends on the model provider defined in `@model-configs/invoice-summariser_generate-text.ts`
 *
 * ### Environment Variables
 * - No flow-specific environment variables are declared in the TypeScript source.
 * - Model-provider credentials may be required by `Generate Text`, but the exact variable names are defined outside this file in `@model-configs/invoice-summariser_generate-text.ts`.
 * - Deployment-level API or connector credentials may be required for the GraphQL runtime or file access path, but they are not exposed in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the inbound GraphQL call and acts as the trigger for the flow. In practice, the important payload element for this flow is the invoice file location exposed as `triggerNode_1.output.url`.
 * 2. `Extract from File` (`extractFromFileNode`) fetches the file from `{{triggerNode_1.output.url}}` and extracts text from it as a PDF. It is configured to join pages, which means the invoice content is consolidated into one text stream for downstream processing. The node does not request raw text passthrough in a separate encoding mode and is set up for direct content extraction rather than tabular CSV-style parsing.
 * 3. `Generate Text` (`LLMNode`) sends the extracted invoice text through an LLM using the system prompt reference `@prompts/invoice-summariser_generate-text_system.md` and model settings from `@model-configs/invoice-summariser_generate-text.ts`. This is the reasoning and structuring step where invoice facts are inferred from the extracted text and formatted into the expected structured JSON-style response.
 * 4. `API Response` (`graphqlResponseNode`) maps the model result from `{{LLMNode_103.output.generatedResponse}}` into a response object with a single field, `output`, and returns it to the caller over the GraphQL boundary.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before extraction starts | The GraphQL request did not include a usable `url`, or the trigger payload shape does not match what the flow wiring expects | Ensure the caller sends the invoice document location in the field exposed as `triggerNode_1.output.url` |
 * | `Extract from File` returns empty or poor text | The file URL is inaccessible, the PDF is image-only, the document is corrupted, or the file is not actually a PDF | Verify the URL is reachable by the runtime, provide a valid PDF, and use OCR-capable preprocessing if the document is scanned |
 * | `output` is empty or incomplete | The extractor produced little text, the invoice content is ambiguous, or the model could not confidently identify all fields | Check extracted text quality first, then improve document quality or adjust the system prompt/model configuration |
 * | `output` is not valid JSON despite the flow intent | The LLM generated malformed structured text because response structure is prompt-guided rather than schema-enforced in this flow | Add downstream validation and parsing safeguards, or tighten the prompt/model config to require strict JSON formatting |
 * | Model call fails | Required model credentials or provider configuration are missing in the referenced model config | Confirm the credentials and provider settings used by `@model-configs/invoice-summariser_generate-text.ts` are correctly configured in the deployment environment |
 * | File extraction fails on certain invoices | Source documents use unsupported formatting, encryption, unusual encoding, or inaccessible remote storage | Normalize files before submission, remove passwords where permitted, and ensure the runtime has network access to the document URL |
 * | Caller expects prior enrichment from another flow | An external orchestrator assumed an upstream preprocessing or validation flow had already run, but this kit has no such internal predecessor | Treat this flow as the direct entrypoint, or add explicit upstream preprocessing outside this project before invoking it |
 *
 * ## Notes
 * The flow has no conditional branches, retries, or fallback paths; execution is linear from request to extraction to generation to response.
 *
 * The extractor is configured with `joinPages` enabled, which is appropriate for single-invoice PDFs but may blur boundaries if the input file contains multiple invoices.
 *
 * Because the response returns model output as a string, production callers should validate and parse the returned content before trusting it as a canonical accounting record.
 *
 * Prompt behavior is central to extraction quality. The exact field set and formatting guarantees come from `invoice-summariser_generate-text_system.md` and the referenced model configuration, not from hardcoded schema enforcement in this flow definition.
 */

// Flow: invoice-summariser

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Invoice Summariser",
  "description": "This AI-powered invoice summarization workflow processes invoices, extracts key details like total amounts, due dates, and vendor information, and generates structured JSON output.",
  "tags": [
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/invoice-summariser",
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
    "invoice_summariser_generate_text_system": "@prompts/invoice-summariser_generate-text_system.md"
  },
  "modelConfigs": {
    "invoice_summariser_generate_text": "@model-configs/invoice-summariser_generate-text.ts"
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
    "id": "extractFromFileNode_525",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "nodeName": "Extract from File",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.url}}",
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
    "id": "LLMNode_103",
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
            "content": "@prompts/invoice-summariser_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/invoice-summariser_generate-text.ts",
        "messages": "@model-configs/invoice-summariser_generate-text.ts",
        "generativeModelName": "@model-configs/invoice-summariser_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_866",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_103.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_525",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_525",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_525-LLMNode_103",
    "source": "extractFromFileNode_525",
    "target": "LLMNode_103",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_103-graphqlResponseNode_866",
    "source": "LLMNode_103",
    "target": "graphqlResponseNode_866",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_866",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_866",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

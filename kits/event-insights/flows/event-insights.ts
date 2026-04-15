/*
 * # Event Insights
 * This flow accepts an API request containing event data and a user question, extracts readable content from the supplied file, and returns an AI-generated answer as the entry-point analysis flow in the wider Event Insights system.
 *
 * ## Purpose
 * This flow is responsible for turning raw event data into an immediately usable natural-language answer. Instead of requiring a caller to manually inspect exported event files or build custom analytics queries, it accepts an event-data file together with a question, converts the file into model-readable content, and asks an LLM to produce an insight grounded in that material. Its core job is therefore ingestion plus interpretation: make event content accessible, then synthesize an answer.
 *
 * Within the broader agent system, the outcome of this flow is a single response field, `answer`, containing the generated insight. That outcome matters because the project is designed as a lightweight, real-time request/response analysis surface. A developer, operator, or automation can submit an event export and a question in one interaction and receive a narrative result without standing up dashboards, indexes, or a separate retrieval layer.
 *
 * In pipeline terms, this flow is both the entry point and the synthesis layer for the kit. There is no separate upstream planning or retrieval flow in the provided agent design; the `API Request` trigger receives the user intent and file reference, `Extract from File` performs the retrieval-like conversion of source material into text, and `Generate Text` performs the final reasoning and answer generation. That makes this flow best understood as a compact ingest-extract-synthesize chain packaged as a single callable unit.
 *
 * ## When To Use
 * - Use when a caller has an event-data file and wants a natural-language answer about its contents in a single API round trip.
 * - Use when the request includes a `question` field asking for trends, anomalies, changes, summaries, or other insights derived from event records.
 * - Use when event data is available as a file or file URL that the extraction node can read, especially PDF-formatted content as configured in this flow.
 * - Use when real-time analysis is preferred over building a persistent analytics model or dashboard.
 * - Use when this kit is being integrated as a backend analysis endpoint for a web app, internal tool, or automation.
 *
 * ## When Not To Use
 * - Do not use when no event-data file or accessible file URL is provided; the extraction step has no source material to process.
 * - Do not use when the caller wants raw structured event rows returned directly rather than an AI-generated narrative answer.
 * - Do not use when the input is not compatible with the configured extractor settings, especially if the source is not readable as the expected `pdf` format.
 * - Do not use when the request omits `question`; the system prompt is designed to answer a user question and depends on that field being present.
 * - Do not use for long-running batch analytics pipelines where asynchronous processing, storage, or post-processing is required; this flow is configured for `realtime` API responses.
 * - Do not use when another system already provides curated metrics, charts, or deterministic calculations and a generated explanation is unnecessary.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `question` | string | Yes | Natural-language question the model should answer about the provided event data. |
 * | `url` | string | Yes | File URL or equivalent trigger output field consumed by `Extract from File` as `{{triggerNode_1.output.url}}`; it must point to the event-data file to analyze. |
 *
 * The trigger is declared without a formal static input schema, so the effective contract is inferred from node mappings and prompt usage. The most important assumptions are that `question` is present and meaningful, and that `url` resolves to a file the extractor can access. The extraction node is configured with `format` set to `pdf`, `joinPages` enabled, UTF-8 encoding, and no row limit, so callers should supply a readable PDF or a source that the runtime can successfully process under those settings.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | string | AI-generated response produced by the `Generate Text` node and returned by the API response node. |
 *
 * The response format is a simple object containing a single prose field, `answer`. In practice this is a natural-language explanation or insight summary rather than a structured analytics payload. Completeness depends on the quality and accessibility of the source file, the specificity of the `question`, and the limits of the configured model; very large or ambiguous source documents may lead to partial or high-level answers.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow for the Event Insights kit.
 * - The only prerequisite is that the invoking client supplies the required trigger data directly, specifically a `question` and a file reference exposed as `url` for extraction.
 *
 * ### Downstream Flows
 * - None are defined in the provided kit. This flow appears to terminate at its own `API Response` node and return the final answer directly to the caller.
 *
 * ### External Services
 * - GraphQL API trigger/response runtime — receives the inbound request and returns the final response — credentialing depends on the hosting Lamatic deployment rather than a flow-local variable
 * - File extraction service via `extractFromFileNode` — fetches and parses the source file from `url` — may require network access to the file location; no explicit flow-local credential is declared
 * - Configured LLM provider from `@model-configs/event-insights_generate-text.ts` — generates the final answer from extracted content and the system prompt — required credential depends on the model provider configured in the model config
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in this flow source.
 * - **Model-provider credentials are still required indirectly** through `@model-configs/event-insights_generate-text.ts`, but their exact variable names are not exposed in the flow definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the realtime API invocation for this flow. In practical terms, the caller sends at least a `question` and a file reference that becomes available as `triggerNode_1.output.url`, establishing both the user’s analytic intent and the source document to inspect.
 * 2. `Extract from File` (`extractFromFileNode`) reads the file located at `{{triggerNode_1.output.url}}`. It is configured for `pdf` input, preserves surrounding text without trim flags, joins pages into a unified extraction result, and prepares the event document as text that downstream generation can use.
 * 3. `Generate Text` (`LLMNode`) invokes the configured language model using the system prompt stored at `@prompts/event-insights_generate-text_system.md` and the model settings defined in `@model-configs/event-insights_generate-text.ts`. This node is the reasoning step: it combines the extracted event content with the incoming question context and produces a generated response intended to answer the user’s request.
 * 4. `API Response` (`graphqlResponseNode`) maps `{{LLMNode_292.output.generatedResponse}}` to the public response field `answer` and returns it to the caller over the GraphQL/API response channel.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request returns an error before generation | The caller did not provide a valid `url`, or the file is inaccessible from the runtime | Verify that `url` is present, correctly formed, reachable from the Lamatic environment, and points to the intended file |
 * | Response is empty or low quality | The extracted file contained little usable text, the PDF was image-only, or the question was too vague | Provide a text-readable source file, ensure OCR has already been applied if needed, and ask a more specific `question` |
 * | The answer does not address the user’s request | `question` was missing, malformed, or not passed through the trigger as expected | Confirm the API request includes `question` as a string and that the invoking client preserves the field name exactly |
 * | File extraction fails for otherwise valid input | The source document is not compatible with the configured `pdf` extraction settings | Supply a PDF file, or change the extractor configuration if a different file type must be supported |
 * | Model invocation fails | Missing or invalid credentials for the LLM provider configured in `@model-configs/event-insights_generate-text.ts` | Check the model configuration, ensure required provider secrets are set in the deployment environment, and retest |
 * | Flow cannot be chained from another process as expected | An external orchestrator assumed an upstream flow would prepare inputs, but this flow expects direct trigger data | Treat this flow as the entry point, or ensure the upstream system explicitly passes through `question` and `url` |
 * | API returns no `answer` field | The `Generate Text` node did not produce `generatedResponse`, so the response mapping had nothing to expose | Inspect model execution logs, validate prompt/model configuration, and confirm extracted content reached the LLM node |
 *
 * ## Notes
 * - The flow metadata describes the system as event-data analysis, but the actual extraction configuration is file-based and specifically set to `pdf`; developers should not assume generic event-stream ingestion without adapting the extractor.
 * - The trigger input schema is not formally declared in `inputs`, so runtime consumers should document and enforce the effective contract externally.
 * - The response shape is intentionally minimal: only `answer` is returned. If callers need citations, extracted text, confidence indicators, or structured aggregates, the flow must be extended.
 * - Because this is a realtime flow, response latency depends on both remote file access and LLM generation time. Large PDFs or slow external file hosts will directly affect end-to-end performance.
 */

// Flow: event-insights

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Event Insights",
  "description": "This AI-powered event data processing system collects event data, passes it to a text generation node, and enables users to ask questions to receive AI-generated insights, enabling efficient event analysis and real-time information retrieval.",
  "tags": [
    "🌱 Growth",
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/event-insights",
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
    "event_insights_generate_text_system": "@prompts/event-insights_generate-text_system.md"
  },
  "modelConfigs": {
    "event_insights_generate_text": "@model-configs/event-insights_generate-text.ts"
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
    "id": "extractFromFileNode_914",
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
    "id": "LLMNode_292",
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
            "content": "@prompts/event-insights_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/event-insights_generate-text.ts",
        "messages": "@model-configs/event-insights_generate-text.ts",
        "generativeModelName": "@model-configs/event-insights_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_837",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_292.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_914",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_914",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_914-LLMNode_292",
    "source": "extractFromFileNode_914",
    "target": "LLMNode_292",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_292-graphqlResponseNode_837",
    "source": "LLMNode_292",
    "target": "graphqlResponseNode_837",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_837",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_837",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

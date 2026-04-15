/*
 * # Email Summariser
 * A single-flow, API-invoked summarisation endpoint that turns inbound email content into a concise summary for use in broader triage, support, or operations pipelines.
 *
 * ## Purpose
 * This flow is responsible for one narrow but high-value task: converting raw email content into a short, readable summary. It is designed for situations where an external system has already received or extracted an email and needs a fast synthesis step before a human or downstream automation acts on it. Instead of forcing operators to read the full message body, the flow produces an AI-generated digest of the email’s main points.
 *
 * The outcome is a single text summary returned to the caller in real time. That matters because this flow is intended to reduce cognitive load and speed up decision-making in support and startup operations contexts. A concise summary can be attached to a ticket, shown in a dashboard, stored alongside the original message, or passed into a later classification or routing step.
 *
 * Within the broader agent pipeline, this flow sits as a focused synthesis stage. It does not retrieve information from a knowledge base, perform multi-step planning, or manage long-running orchestration. Instead, it acts as a composable summarisation primitive that is typically invoked after an upstream email ingestion system has captured the message content, and before any downstream triage, prioritisation, or workflow automation consumes the summary.
 *
 * ## When To Use
 * - Use when an upstream system has already captured an email and you need a concise summary of its contents.
 * - Use when a support, operations, or productivity workflow needs a short digest before a human reviews the full email.
 * - Use when the caller can provide email content in a form that the internal `API` node can expose to the LLM as summarisation input.
 * - Use when you need a synchronous, real-time API response containing generated summary text.
 * - Use when this flow is being embedded as a summarisation step inside a larger n8n, helpdesk, inbox triage, or custom HTTP-triggered pipeline.
 *
 * ## When Not To Use
 * - Do not use when no email body or meaningful textual content is available to summarise.
 * - Do not use when the task is classification, extraction of structured fields, reply drafting, or sentiment analysis rather than summarisation.
 * - Do not use when the upstream caller has not yet ingested or normalized the email payload.
 * - Do not use when you need thread-aware reasoning unless the caller explicitly includes prior thread context in the payload.
 * - Do not use when a different flow is responsible for retrieving mailbox data directly; this flow assumes the content is already available at invocation time.
 * - Do not use for non-text binary inputs such as attachments, PDFs, or images unless another process has already converted them into text.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `subject` | `string` | No | Email subject line. Recommended when available because it can improve summarisation quality if included in the upstream payload transformation. |
 * | `from` | `string` | No | Sender identifier or email address. Useful context for the caller to provide, though this flow does not explicitly validate it. |
 * | `date` | `string` | No | Email timestamp, ideally in ISO-8601 format. Optional contextual metadata for the upstream payload. |
 * | `body` | `string` | Yes, in practice | Primary plain-text email content to be summarised. This is the most important input and should contain the substantive message body. |
 * | `thread` | `string` or `array` | No | Optional prior thread context if the caller wants the summary to reflect more than the latest message. |
 * | `previous_messages` | `string` or `array` | No | Optional historical message context supplied by the caller for richer summarisation. |
 *
 * Although `inputs` is empty in the exported flow definition, the flow is functionally driven by the inbound request payload received at `API Request`. In practice, the caller must provide enough email content for the internal `API` node to produce the text consumed by `Generate Text`.
 *
 * Input should be primarily textual and already extracted from the original email source. Plain text is preferred over raw MIME or HTML. Very large bodies may be truncated by model limits or produce less focused summaries. If metadata such as `subject` or `from` is sent, it should be well-formed strings rather than nested opaque objects unless the upstream caller knows the receiving transformation can handle them.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `output` | `string` | The AI-generated summary returned from `Generate Text`, exposed by the `API Response` node as the flow’s response payload. |
 *
 * The response is a simple object containing one prose field, `output`. That field contains generated natural-language summary text rather than a structured schema. The completeness and style of the summary depend on the prompt and model configuration, and very long or poorly formatted inputs may lead to abbreviated or less precise outputs.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This flow is effectively an entry-point flow within this kit. It is invoked directly through `API Request` rather than being called by another Lamatic flow in the same project.
 * - In operational deployments, an external upstream system usually runs before this flow. Typical examples include an email ingestion process in n8n, a helpdesk forwarder, or a mailbox polling job.
 * - That upstream system must have already produced the email text to summarise, typically as a `body` field and optionally supporting metadata such as `subject`, `from`, `date`, `thread`, or `previous_messages`.
 * - The critical dependency is that the inbound request must contain enough information for the `API` node to emit usable text for the LLM stage.
 *
 * ### Downstream Flows
 * - No downstream Lamatic flows are defined in this kit.
 * - In real deployments, external consumers may use this flow’s `output` field for ticket enrichment, inbox triage, urgency review, CRM note generation, or additional classification pipelines.
 * - Any downstream consumer should read the `output` field as the canonical summary text.
 *
 * ### External Services
 * - Lamatic GraphQL-style trigger/response runtime — receives the inbound request and returns the final payload — required runtime-managed platform configuration used by `API Request` and `API Response`
 * - External webhook at `https://dhruvlamatic.app.n8n.cloud/webhook/8cfe684a-6b95-495f-b29d-afb7a2c012e2` — called by the `API` node to fetch or transform the summarisation input — no explicit credential is configured in the flow source
 * - Configured LLM provider via the model config `@model-configs/email-summariser_generate-text.ts` — generates the summary text — required provider credentials depend on the model specified in that model config and are used by `Generate Text`
 * - Prompt resource `@prompts/email-summariser_generate-text_system.md` — provides the system instruction that tells the model to summarise email content — used by `Generate Text`
 *
 * ### Environment Variables
 * - No flow-specific environment variables are declared in the flow source.
 * - Provider-specific credentials may still be required by the model referenced in `@model-configs/email-summariser_generate-text.ts`; those are resolved by the `Generate Text` node through Lamatic’s model configuration system.
 * - If the external webhook requires authentication in a deployed variant of this flow, the necessary secret would be associated with the `API` node, but no such variable is present in the current exported definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) receives the inbound real-time API invocation and exposes the request payload to the flow. This is the public entry point for callers that want an email summary.
 * 2. `API` (`apiNode`) performs a `GET` request to the configured external webhook URL. In this flow, it acts as the intermediary step that fetches, normalises, or transforms the content that will ultimately be summarised. The rest of the flow assumes this node yields text suitable for the LLM input.
 * 3. `Generate Text` (`LLMNode`) runs the system prompt referenced at `@prompts/email-summariser_generate-text_system.md` using the model and messaging configuration defined in `@model-configs/email-summariser_generate-text.ts`. It takes the text made available from the prior step and generates a concise natural-language summary.
 * 4. `API Response` (`graphqlResponseNode`) returns the final payload to the caller. Its output mapping exposes `{{LLMNode_367.output.generatedResponse}}` as the response field `output`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Response contains an empty or low-quality summary | The inbound payload did not include meaningful email text, or the `API` node did not produce usable content for the LLM | Ensure the caller sends substantive `body` text and verify that the external webhook used by `API` returns the expected summarisation input |
 * | Flow fails before summarisation | The external webhook configured in `API` is unavailable, incorrect, or returning an error | Check the webhook URL, confirm the upstream service is live, and test the endpoint independently |
 * | Model invocation fails | The model provider configured in `@model-configs/email-summariser_generate-text.ts` is missing credentials or is misconfigured | Verify the Lamatic model configuration, provider selection, and any required provider secrets |
 * | Caller receives malformed or unexpected output | The external webhook returned a payload shape different from what the prompt or model configuration expects | Align the upstream payload transformation so that the `Generate Text` node receives the intended text input |
 * | Summary ignores important context | The caller only sent the latest body text and omitted relevant subject or thread history | Include `subject`, `thread`, or `previous_messages` when context matters, and confirm the upstream transformation preserves them |
 * | Invocation produces no useful result for attachments | The input email content is stored in attachments, HTML, PDFs, or images rather than plain text | Add an upstream extraction step to convert non-text content into clean text before calling this flow |
 * | End-to-end chain fails in a larger deployment | The external email ingestion process did not run or did not forward the captured content into this flow | Validate the upstream email ingestion stage and confirm it passes the required fields into `API Request` |
 *
 * ## Notes
 * - The flow has no declared private `inputs`, so its practical contract is defined by how the caller structures the request and by what the external `API` node returns.
 * - The `API` node is configured as a `GET` request with an empty body, which means the exact mechanism by which request data is used depends on the surrounding runtime and the target webhook implementation.
 * - Summary style, faithfulness, and length are primarily governed by the referenced system prompt and model configuration rather than by explicit logic in this flow.
 * - Because the response schema is minimal, downstream systems that need structured outputs such as urgency, action items, or extracted entities should add a separate extraction or classification step rather than relying on free-form summary text alone.
 */

// Flow: email-summariser

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Email Summariser",
  "description": "This N8N workflow builds an AI-powered email summarization tool that automatically processes incoming emails, extracts key insights, and generates concise summaries, enabling users to quickly understand important information.",
  "tags": [
    "📞 Support",
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/email-summariser",
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
    "email_summariser_generate_text_system": "@prompts/email-summariser_generate-text_system.md"
  },
  "modelConfigs": {
    "email_summariser_generate_text": "@model-configs/email-summariser_generate-text.ts"
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
    "id": "apiNode_490",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "nodeName": "API",
        "url": "https://dhruvlamatic.app.n8n.cloud/webhook/8cfe684a-6b95-495f-b29d-afb7a2c012e2",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "retry_deplay": "0"
      }
    }
  },
  {
    "id": "LLMNode_367",
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
            "content": "@prompts/email-summariser_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/email-summariser_generate-text.ts",
        "messages": "@model-configs/email-summariser_generate-text.ts",
        "generativeModelName": "@model-configs/email-summariser_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_539",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_367.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-apiNode_490",
    "source": "triggerNode_1",
    "target": "apiNode_490",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_490-LLMNode_367",
    "source": "apiNode_490",
    "target": "LLMNode_367",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_367-graphqlResponseNode_539",
    "source": "LLMNode_367",
    "target": "graphqlResponseNode_539",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_539",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_539",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

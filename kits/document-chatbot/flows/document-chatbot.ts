/*
 * # Document Chatbot
 * A chat-widget entry flow that extracts text from a configured document and uses an LLM to answer user questions, serving as the single end-user interaction pipeline in this agent system.
 *
 * ## Purpose
 * This flow is responsible for turning a chat interaction into a document-grounded answer. A user sends a message through an embedded chat widget, the flow retrieves text from a document source, prepares that extracted content for prompting, and asks a language model to generate a response based on the document context. Its core job is to bridge conversational input and document understanding without requiring the user to manually search the source material.
 *
 * The outcome is a single chatbot response returned to the same widget session. That response matters because it is the user-facing product of the entire document QA experience: if this flow succeeds, the application can provide self-serve answers from manuals, syllabi, policies, sales collateral, or other reference documents. In this template, the response is only as good as the text extraction and prompt grounding performed upstream within the same flow.
 *
 * In the broader agent architecture, this flow is both the entry point and the synthesis stage. There is no separate retrieval flow in this template. Instead, retrieval-like behavior is implemented inline by the `Extract from File` node, context shaping happens in `Text Extraction`, and synthesis happens in `Generate Text`. That makes this a compact end-to-end plan-extract-synthesize pipeline rather than a multi-flow orchestration.
 *
 * ## When To Use
 * - Use when a user asks a question through the embedded chat widget and the answer should be grounded in a document or media source.
 * - Use when you want a single-flow implementation with no separate retrieval or indexing pipeline.
 * - Use when the source content can be extracted directly from a file URL or widget-provided document input.
 * - Use for support, sales, onboarding, or enablement experiences where users need conversational answers from static reference material.
 * - Use when rapid setup is more important than building a dedicated document index or retrieval system.
 *
 * ## When Not To Use
 * - Do not use when the answer should come from live web data, transactional systems, or any source that is not available through the configured file extraction step.
 * - Do not use when no document or media source is available to ground the answer.
 * - Do not use when you need multi-document retrieval, ranking, chunking, embeddings, or search over a large corpus; a dedicated retrieval flow is a better fit.
 * - Do not use when the input is a non-chat invocation; this flow is triggered by a chat widget, not a general API payload schema.
 * - Do not use when strict citation, provenance, or audit-grade answer traceability is required unless you extend the prompts and post-processing accordingly.
 * - Do not use when an upstream system is expected to supply already-extracted context; this flow performs extraction itself and is not designed as a pure answer-generation subflow.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `chatMessage` | `string` | Yes | The end user's message submitted through the chat widget. This is the primary question the LLM answers. |
 * | `file` / `attachments` | `file` or `array` | Conditionally | Conceptual document input associated with the chat session. In the broader design this may come from the widget integration, though this exported flow currently also contains a fixed `fileUrl` in the extraction node. |
 * | `conversationId` | `string` | No | Optional session identifier that may be present in widget-trigger metadata for chat continuity. |
 * | `userId` | `string` | No | Optional user identifier supplied by the embedding application or widget context. |
 * | `timestamp` | `string` or `number` | No | Optional event timing metadata from the trigger environment. |
 *
 * This flow declares no explicit private `inputs` object in the exported TypeScript, so all runtime inputs are mediated through the `Chat Widget` trigger. In practice, the key required input is the user's chat text. The extraction node is configured with a hard-coded `fileUrl` pointing to a PDF, so the template as exported assumes a valid remote PDF is always available. If the widget is later customized to pass user-selected files, those files must be in a format supported by the extractor and accessible to the runtime.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `content` | `string` | The final chatbot response returned by `Chat Response`, populated from `LLMNode_444.output.generatedResponse`. |
 *
 * The output is a single prose response sent back to the chat widget. It is not a structured object, list of citations, or chunked result set. Completeness depends on successful document extraction, whatever transformation the `Text Extraction` script performs, and the token limits and prompting behavior of the configured model. Long source documents may be summarized or selectively used rather than represented exhaustively.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow and the primary invoker in this kit.
 * - The flow starts directly from the `Chat Widget` trigger and does not require any prior Lamatic flow to have run.
 *
 * ### Downstream Flows
 * - None. The exported template is a single-flow pipeline.
 * - The terminal consumer is the end user's chat session via `Chat Response`, which uses `LLMNode_444.output.generatedResponse` as the returned text.
 *
 * ### External Services
 * - Lamatic chat widget trigger — captures the end user's chat event and session context — credentials/configuration are defined in the widget trigger settings referenced by `@triggers/widgets/document-chatbot_chat-widget.ts`
 * - File extraction service in Lamatic `extractFromFileNode` — fetches and parses the configured document source, here a remote PDF — no explicit credential shown in the flow source
 * - Configured LLM provider via `Generate Text` model config — generates the grounded response from prompts, message state, and extracted context — required credential depends on the model/provider defined in `@model-configs/document-chatbot_generate-text.ts`
 *
 * ### Environment Variables
 * - Provider-specific model credential variable(s) — authenticate the LLM configured in `@model-configs/document-chatbot_generate-text.ts` — used by `Generate Text`
 * - Any widget/domain configuration variables required by the deployment environment — govern where the chat widget can be embedded or invoked — used by `Chat Widget`
 *
 * ## Node Walkthrough
 * 1. `Chat Widget` (`chatTriggerNode`) starts the flow when a user submits a message in the embedded chat interface. It provides the conversational entry event and acts as the anchor for returning the eventual response to the same chat session.
 *
 * 2. `Extract from File` (`extractFromFileNode`) retrieves content from the configured document source. In this exported template, it is set to read a PDF from `https://www.nielit.gov.in/sites/default/files/ccc_syllabus_0.pdf`, parse it with `format` set to `pdf`, and join pages into a single extraction stream. This means the flow currently answers questions against that configured document unless the node is modified.
 *
 * 3. `Text Extraction` (`codeNode`) runs the custom script referenced at `@scripts/document-chatbot_text-extraction.ts`. Its purpose is to post-process the extractor output into the form expected by the prompt and model stage. Although the script contents are not inlined here, this node is where raw extracted data is typically normalized, cleaned, or reshaped into prompt-ready text.
 *
 * 4. `Generate Text` (`LLMNode`) composes the system and user prompts from `@prompts/document-chatbot_generate-text_system.md` and `@prompts/document-chatbot_generate-text_user.md`, combines them with the model, memory, and message settings from `@model-configs/document-chatbot_generate-text.ts`, and asks the configured LLM to generate an answer. This is the synthesis step that turns user intent plus extracted document context into a natural-language response.
 *
 * 5. `Chat Response` (`chatResponseNode`) sends the model output back to the widget. Its `content` field is mapped directly from `{{LLMNode_444.output.generatedResponse}}`, so whatever text the LLM returns becomes the visible answer to the user.
 *
 * 6. `Sticky Note` (`stickyNoteNode`) is non-executable documentation on the canvas. It explains the intent of the flow for maintainers but does not participate in runtime processing.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | No response is returned to the chat widget | The `Generate Text` node failed, or `Chat Response` received an empty `generatedResponse` | Check the LLM provider credentials and model config, inspect prompt variables, and verify the `LLMNode_444.output.generatedResponse` field is being populated |
 * | The chatbot answers generically instead of using the document | Extraction returned poor or empty text, or the prompt/script did not inject the extracted content correctly | Validate the PDF is reachable, inspect the output of `Extract from File`, and review the `Text Extraction` script and prompt templates for missing variable mappings |
 * | The flow fails at the model step | Missing or invalid model provider credentials | Configure the required provider API key or environment variable referenced by `@model-configs/document-chatbot_generate-text.ts` |
 * | The extractor returns no content | The remote `fileUrl` is inaccessible, the PDF is malformed, password-protected, or unsupported | Confirm the document URL is public and valid, replace the file with a supported source, and test extraction independently |
 * | The user asks about a different file but receives answers from the template PDF | The extraction node is hard-coded to a specific `fileUrl` rather than using per-request attachments | Reconfigure `Extract from File` to consume widget-provided file input instead of the static PDF URL |
 * | Responses are incomplete or overly brief | Model context window limits or prompt constraints truncated usable document context | Reduce document size, add chunking/retrieval, refine the `Text Extraction` script, or adjust the model configuration to support larger context |
 * | Chat trigger works locally but not on the target site | Widget domain settings do not allow the deployment origin | Review the trigger configuration referenced by `@triggers/widgets/document-chatbot_chat-widget.ts` and add the correct allowed domains |
 * | Upstream flow not having run | Not applicable in normal operation because this is an entry-point flow | Invoke this flow directly from the chat widget; no prior Lamatic flow is required |
 *
 * ## Notes
 * - The flow source exports an empty `inputs` object. That means there are no separately declared runtime input fields at the template level; operational inputs arrive through the chat trigger and node-level configuration.
 * - Despite the broader agent description mentioning user-provided documents, this specific exported flow is currently configured with a fixed PDF URL in `Extract from File`. Developers should treat that as the effective retrieval source unless they rewire the node.
 * - `joinPages` is enabled in the extraction node, so the PDF is likely flattened into one continuous text body before post-processing. This is simple and effective for smaller documents but can reduce page-level traceability.
 * - `returnRawText` is disabled, which implies the extraction output may be structured rather than plain text before the code node transforms it.
 * - There are no tools configured in `Generate Text`; all answer grounding depends on the extracted document content and the prompt design.
 * - Because prompt files, model config, and the code script are referenced externally, any meaningful behavior changes may live outside the flow TypeScript itself. For production maintenance, review those referenced assets alongside this flow.
 */

// Flow: document-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Document Chatbot",
  "description": "This flow integrates a chatbot widget into your local application, enabling users to get answers based on provided documents or media.",
  "tags": [
    "📞 Support",
    "🏷️ Sales"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/document-chatbot",
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
    "document_chatbot_generate_text_user": "@prompts/document-chatbot_generate-text_user.md",
    "document_chatbot_generate_text_system": "@prompts/document-chatbot_generate-text_system.md"
  },
  "scripts": {
    "document_chatbot_text_extraction": "@scripts/document-chatbot_text-extraction.ts"
  },
  "modelConfigs": {
    "document_chatbot_generate_text": "@model-configs/document-chatbot_generate-text.ts"
  },
  "triggers": {
    "document_chatbot_chat_widget": "@triggers/widgets/document-chatbot_chat-widget.ts"
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
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Chat Widget",
        "chat": "",
        "domains": "@triggers/widgets/document-chatbot_chat-widget.ts"
      }
    }
  },
  {
    "id": "extractFromFileNode_239",
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
        "fileUrl": "https://www.nielit.gov.in/sites/default/files/ccc_syllabus_0.pdf",
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
    "id": "codeNode_543",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Text Extraction",
        "code": "@scripts/document-chatbot_text-extraction.ts"
      }
    }
  },
  {
    "id": "LLMNode_444",
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
            "id": "9cd25ecf-58ad-45b0-8ca3-4412bd0f0f54",
            "role": "user",
            "content": "@prompts/document-chatbot_generate-text_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/document-chatbot_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/document-chatbot_generate-text.ts",
        "messages": "@model-configs/document-chatbot_generate-text.ts",
        "generativeModelName": "@model-configs/document-chatbot_generate-text.ts"
      }
    }
  },
  {
    "id": "stickyNoteNode_592",
    "type": "stickyNoteNode",
    "position": {
      "x": 262.4254848785547,
      "y": 0.38631993294313816
    },
    "measured": {
      "width": 305,
      "height": 186
    },
    "data": {
      "nodeId": "stickyNoteNode",
      "values": {
        "nodeName": "Sticky Note",
        "text": "# This flow allows for a chatbot widget to be integrated in your local application, which allows for answering questions based on given documents/media.",
        "color": "purple",
        "nodeId": "stickyNoteNode",
        "nodeType": "stickyNoteNode"
      }
    }
  },
  {
    "id": "chatResponseNode_137",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "nodeName": "Chat Response",
        "content": "{{LLMNode_444.output.generatedResponse}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_239",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_239",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_239-codeNode_543",
    "source": "extractFromFileNode_239",
    "target": "codeNode_543",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_543-LLMNode_444",
    "source": "codeNode_543",
    "target": "LLMNode_444",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_444-chatResponseNode_137",
    "source": "LLMNode_444",
    "target": "chatResponseNode_137",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_137",
    "source": "triggerNode_1",
    "target": "chatResponseNode_137",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

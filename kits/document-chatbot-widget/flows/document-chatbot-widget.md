# Document Chatbot (Widget)
A retrieval-augmented chat widget flow that answers end-user questions from a connected document index and serves as the entry-point conversational interface in the wider agent system.

## Purpose
This flow is responsible for turning a user’s free-form chat message into a grounded answer based on content stored in a connected vector database. It solves the core documentation-assistance task for the kit: accepting a question from an embedded chat widget, retrieving relevant source material, and using that retrieved context to generate a response suitable for support, product education, or release-note discovery.

The outcome of the flow is a single conversational reply returned directly to the widget. That reply matters because it is the user-visible product of the system: if retrieval is relevant and generation is well grounded, users can self-serve answers without escalating to support or searching static documentation manually.

Within the broader pipeline, this flow is both the entry point and the synthesis path. It sits across the retrieve-and-answer stages of a classic retrieval-augmented generation chain: the `chatTriggerNode` captures the request, the `RAG` node performs semantic retrieval plus response generation, and the `Chat Response` node returns the final text to the caller. Per the parent agent context, this template is implemented as a single-flow pipeline rather than a multi-flow orchestration, so it does not depend on a prior planning flow.

## When To Use
- Use when an end user asks a question through an embedded Lamatic chat widget or a host application relaying widget-style chat messages.
- Use when answers should be grounded in an indexed documentation corpus rather than generated from model knowledge alone.
- Use for support-style and product-education interactions such as user documentation lookup, release-note questions, onboarding guidance, and feature clarification.
- Use when a vector database has already been connected and populated with the content the assistant is expected to answer from.
- Use when the desired output is a conversational prose answer rather than a structured API object or background batch job result.

## When Not To Use
- Do not use if no vector database is configured or the document corpus has not been indexed; retrieval quality will be poor or nonexistent.
- Do not use for non-chat triggers such as scheduled jobs, webhook event processing, or backend-only document transformation pipelines.
- Do not use when the input is not a natural-language user message, such as binary files, large documents for ingestion, or structured records requiring transformation.
- Do not use when you need deterministic structured outputs like JSON extraction, classification labels, or tool-call payloads; this flow is designed to return conversational text.
- Do not use when a sibling or custom flow is intended to answer from live web search, transactional systems, or private business APIs instead of a vector index.
- Do not use if upstream application logic requires strict citations, source attribution formatting, or compliance review that this flow has not been explicitly configured to provide.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `chatMessage` | `string` | Yes | The latest end-user message captured by the chat widget trigger and passed into retrieval and generation. |
| `conversationId` | `string` | No | Conversation/session identifier that may be supplied by the widget or host application for continuity and routing. |
| `history` | `Array<{ role, content }>` | No | Prior conversation turns, if the trigger implementation provides them, to preserve conversational context. |
| `metadata` | `object` | No | Optional widget, page, user, or channel context supplied by the host environment. |

The flow’s TypeScript definition exposes no separately declared private `inputs`, so invocation is driven entirely by the chat trigger payload. The only field directly referenced in node wiring is `triggerNode_1.output.chatMessage`, which means a usable user utterance is the critical requirement. Input should be natural-language text suitable for semantic retrieval. Empty, null, or non-text messages are likely to produce weak retrieval or no meaningful answer.

## Outputs
| Field | Type | Description |
|---|---|---|
| `content` | `string` | The final chatbot reply returned by the `Chat Response` node, sourced from `RAGNode_314.output.modelResponse`. |

The output is a single prose response intended for direct display in a chat UI. It is not a structured object and, in this flow definition, retrieved passages, scores, citations, and intermediate metadata are not explicitly returned to the caller. Completeness depends on vector index coverage, model behavior, and any limits defined in the referenced RAG model configuration.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow for the kit.
- Invocation comes directly from a chat widget event or a host application that forwards the user’s current message.
- The flow consumes the trigger-produced field `chatMessage` from `triggerNode_1.output.chatMessage`.

### Downstream Flows
- None are defined in this kit context. The flow terminates by returning a response to the chat widget.
- A host application may consume the returned `content` field for rendering, logging, or analytics, but no downstream Lamatic flow dependency is declared.

### External Services
- Lamatic chat widget trigger/runtime — receives interactive end-user chat events and session context — required platform/widget deployment configuration
- Connected vector database — stores embedded document chunks used for semantic retrieval — required vector store connector credentials as configured in the Lamatic environment
- Embedding model referenced by `@model-configs/document-chatbot-widget_rag.ts` — converts the user query for retrieval — required model provider credentials in the Lamatic environment
- Generative model referenced by `@model-configs/document-chatbot-widget_rag.ts` — produces the final grounded natural-language answer — required model provider credentials in the Lamatic environment

### Environment Variables
- No explicit environment variable names are declared in this flow source.
- Model and vector-store credentials are implicitly required by the `RAG` node through the referenced model configuration `@model-configs/document-chatbot-widget_rag.ts` and the runtime connector setup.

## Node Walkthrough
1. `Chat Widget` (`chatTriggerNode`) starts the flow when a user sends a message from the embedded chat interface. Its practical role in this flow is to capture the latest utterance and expose it as `triggerNode_1.output.chatMessage`, along with any session context the widget runtime maintains.

2. `RAG` (`RAGNode`) receives the user’s message via its `queryField`, which is bound to `{{triggerNode_1.output.chatMessage}}`. It performs the core retrieval-augmented step: querying the connected vector database for relevant document chunks, applying the referenced retrieval settings such as `limit`, `certainty`, message handling, and model selections from `@model-configs/document-chatbot-widget_rag.ts`, and then generating an answer under the system prompt “You are a helpful AI assistant that answers user queries based on the context provided to you.” Its output of interest here is `modelResponse`.

3. `addNode_930` (`addNode`) sits between retrieval and response but has no meaningful configured transformation in the exported source. In operational terms, it acts as a pass-through placeholder in the execution chain. Developers should not assume it enriches, validates, or reshapes the RAG output unless they later configure it to do so.

4. `Chat Response` (`chatResponseNode`) formats the flow result for the widget response channel. Its `content` is mapped directly from `{{RAGNode_314.output.modelResponse}}`, so the user sees the exact generated answer from the RAG step.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow returns no useful answer or fails at the retrieval step | The vector database is not connected, is empty, or the `RAG` node has no valid vector store configuration | Configure and test the vector database connector, ensure documents are embedded and indexed, and verify the `RAG` node is pointed at the intended store |
| The flow errors when generating a response | Missing or invalid LLM or embedding-model credentials referenced indirectly by `@model-configs/document-chatbot-widget_rag.ts` | Check provider credentials in the Lamatic environment, validate the referenced model configuration, and confirm the selected models are available to the deployment |
| The chatbot responds with generic or hallucinated content | Retrieval returned weak matches, the corpus does not contain the answer, or similarity thresholds/model settings are poorly tuned | Improve index coverage, review `limit` and `certainty` values in the referenced model config, and test with representative queries |
| The chatbot returns an empty or irrelevant response to a user message | The incoming `chatMessage` is empty, malformed, or not natural-language text suitable for semantic search | Validate trigger payloads in the host application, ensure the latest message is passed as text, and reject blank submissions before invoking the flow |
| The widget appears to trigger but no response is returned | The response path is broken, the `Chat Response` node is miswired, or the RAG node did not produce `modelResponse` | Verify the response edge from `triggerNode_1` to `chatResponseNode_842`, confirm `content` is mapped from `RAGNode_314.output.modelResponse`, and inspect runtime logs for upstream node failure |
| Conversation continuity is inconsistent across turns | The host app is not preserving or passing stable session context, or the widget runtime is not configured as expected | Ensure the widget or host application maintains a consistent `conversationId` and forwards prior context if required by your deployment |
| A calling system expects data from a prior flow and this flow does not have it | This template is a standalone entry-point flow and is not designed to consume upstream Lamatic flow outputs | Invoke it directly from the chat widget or adapt the trigger contract if you need orchestration with earlier flows |

## Notes
- This flow defines no explicit private input variables in `inputs`, so most operational setup lives outside the flow source in widget deployment, model configuration, and vector database connection.
- The referenced constitution `@constitutions/default.md` exists at the flow level but is not directly surfaced in the node wiring shown here; any constitution-level behavior depends on how the Lamatic runtime applies referenced resources.
- The `vectorDB` field on the `RAG` node is blank in the exported source, which indicates the actual vector-store binding is expected to be supplied through runtime configuration or post-import setup rather than hardcoded in the flow file.
- `addNode_930` currently contributes no visible business logic. It can be removed or repurposed if you need output shaping, metadata enrichment, or guardrail logic before returning the chat response.
- Because the final response is taken directly from `RAGNode_314.output.modelResponse`, any formatting, tone, or safety behavior is primarily controlled by the RAG node’s system prompt, retrieved context, and referenced model configuration.
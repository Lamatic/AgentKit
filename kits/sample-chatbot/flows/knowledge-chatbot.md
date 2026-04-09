# Knowledge Chatbot
A chat-triggered retrieval-augmented generation flow that answers end-user questions from previously indexed knowledge content and serves as the runtime question-answering layer of the wider Knowledge Chatbot kit.

## Purpose
This flow is responsible for the final conversational retrieval step in the Knowledge Chatbot bundle. It takes a user message from a chat widget, turns that message into a retrieval query, searches a configured vector database for relevant indexed content, and uses a generative model to draft an answer grounded in that content. In practical terms, it solves the problem of making already-ingested organizational knowledge accessible through natural-language conversation instead of requiring users to manually search documents, pages, or records.

The outcome is a contextual answer returned directly to the chat interface. That outcome matters because the rest of the kit is designed to ingest and vectorize content from one chosen source, while this flow is the piece that actually exposes that knowledge base to end users. Without this flow, the indexed content remains searchable only at the storage layer; with it, the knowledge base becomes an interactive support, documentation, or internal-assistant experience.

In the broader pipeline described by the parent agent, this flow sits after ingestion and vector indexing. The indexation flows perform the extract, chunk, embed, and write stages; this flow performs the runtime retrieve-and-synthesize stage. It is therefore not the place where source content is prepared or updated, but the place where that prepared content is queried and translated into a user-facing response.

## When To Use
- Use when a user asks a natural-language question through the configured chat widget and you want the answer grounded in the project’s indexed knowledge base.
- Use after one of the kit’s indexation flows has already populated the selected vector database with embedded content.
- Use when the goal is contextual question answering over internal or curated content rather than open-ended generation from model priors alone.
- Use when you need a lightweight runtime API for conversational retrieval without building a custom retrieval orchestration layer.
- Use when the same vector store and embedding strategy used during ingestion are available and properly configured for runtime querying.

## When Not To Use
- Do not use before any indexation flow has run; the vector database must already contain embedded knowledge documents.
- Do not use when the user intent is to ingest, refresh, crawl, scrape, or re-index content; a sibling indexation flow is the correct choice for that work.
- Do not use when the input is not a chat message delivered through the widget trigger configured for this flow.
- Do not use when no vector database, embedding model, or generative model has been configured in the flow inputs.
- Do not use when the answer must come from current public web data that has not been indexed into the knowledge base.
- Do not use when strict structured extraction is required as the primary output; this flow returns a conversational answer, not a guaranteed schema-bound object.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `chatMessage` | `string` | Yes | The end-user’s question submitted through the `Chat Widget` trigger. This is the runtime query used by the `RAG` node. |
| `vectorDB` | `select` | Yes | The vector database connection or index selection that the `RAG` node queries for relevant content. |
| `embeddingModelName` | `model` | Yes | The embedding model used to convert the incoming query into vector space for similarity search. |
| `generativeModelName` | `model` | Yes | The text generation model used to synthesize an answer from the retrieved context and prompts. |

The only trigger-level user payload exposed at runtime is the chat message coming from the widget. The other required fields are private flow configuration inputs that must be set by the developer or operator before deployment. The query is assumed to be plain natural language text. No explicit max length, language restriction, or schema validation is declared in the flow source, so practical limits depend on the selected trigger, vector database, and models.

## Outputs
| Field | Type | Description |
|---|---|---|
| `content` | `string` | The final answer returned to the chat client, sourced from `RAGNode_711.output.modelResponse`. |

The response format is a single prose answer intended for direct display in a chat interface. The flow does not explicitly expose retrieved passages, citations, scores, or structured metadata in its response payload because the `Chat Response` node only maps the generated answer text and leaves `references` empty. Completeness depends on the quality and coverage of the indexed knowledge base and the retrieval settings defined in the referenced model configuration.

## Dependencies
### Upstream Flows
- This is not the ingestion entry point for the kit; it depends on one of the sibling indexation flows having run earlier to populate the configured vector database.
- Any one relevant indexation flow in the parent bundle may act as the prerequisite, such as crawling, file-store, database, document, or spreadsheet ingestion, provided it has completed the extract, chunk, embed, and vector-write process.
- Required prerequisite data is the indexed content itself inside the selected `vectorDB`. This flow does not directly consume a JSON field emitted by an upstream flow; instead, it consumes the persisted vectorized knowledge artifacts those flows wrote into the shared vector store.
- At runtime, this flow directly consumes `chatMessage` from the `Chat Widget` trigger rather than outputs from another Lamatic flow invocation.

### Downstream Flows
- No downstream Lamatic flow is defined in this source. The flow terminates by returning a chat response to the invoking widget.
- External consumers such as a frontend chat client may consume the `content` field for display, but no further in-kit chaining is encoded here.

### External Services
- Chat widget trigger — receives the end-user message and opens the conversational entry point — required widget/domain configuration stored in `@triggers/widgets/knowledge-chatbot_chat-widget.ts`
- Vector database — stores and serves similarity-searchable knowledge chunks used during retrieval — required credential depends on the selected `vectorDB` connector
- Embedding model provider — embeds the user query for vector similarity search — required credential depends on the selected `embeddingModelName` provider
- Generative model provider — drafts the final natural-language answer from retrieved context and prompts — required credential depends on the selected `generativeModelName` provider
- Lamatic prompt resources — supplies the system and user prompt templates that shape RAG behavior — no separate runtime credential indicated in this flow source

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Provider-specific secrets may still be required by the selected vector database and model integrations, but they are not named in this flow definition.

## Node Walkthrough
1. `Chat Widget` (`triggerNode`) starts the flow when an end user submits a message in the configured chat interface. Its relevant output is `chatMessage`, which becomes the retrieval query for the next step. The widget’s domain and chat configuration are referenced from the trigger resource file rather than hard-coded in the flow.
2. `RAG` (`dynamicNode`) receives the user’s message through `queryField` mapped from `{{triggerNode_1.output.chatMessage}}`. It queries the configured `vectorDB` using the selected `embeddingModelName`, applies retrieval behavior from the referenced model configuration such as `limit`, `certainty`, `messages`, and `memories`, and then calls the selected `generativeModelName` to compose an answer. The node is also shaped by two prompt resources: a system prompt that defines assistant behavior and a user prompt that frames how retrieved knowledge and the query should be combined.
3. `Chat Response` (`dynamicNode`) takes `{{RAGNode_711.output.modelResponse}}` and returns it as the final chat payload under `content`. This is the response edge target for the original trigger, which means the flow closes by sending the generated answer back to the invoking chat client.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow cannot start or the chat widget does not deliver messages | The widget trigger configuration or allowed domains are misconfigured | Verify the settings in `@triggers/widgets/knowledge-chatbot_chat-widget.ts`, confirm the widget is deployed on an allowed domain, and retest the trigger path |
| The `RAG` node fails before retrieval | `vectorDB`, `embeddingModelName`, or `generativeModelName` has not been configured in private inputs | Configure all required private inputs for `RAGNode_711` and ensure the selected providers are accessible in the workspace |
| Responses are empty, generic, or say no relevant information was found | The vector database is empty, the wrong index was selected, or an upstream indexation flow has not run | Run the appropriate indexation flow first, verify that documents were embedded into the intended `vectorDB`, and confirm this flow points to that same store |
| Retrieval quality is poor even though documents exist | The runtime embedding model is incompatible with the embeddings used during ingestion, or retrieval thresholds are too restrictive | Use the same or compatible embedding model family used during indexing and review the referenced RAG model configuration for `certainty` and retrieval limits |
| The flow returns an answer unrelated to internal content | The generative model is responding from weak or missing retrieval context | Check that the correct vector store is selected, confirm indexed content coverage, and inspect the RAG prompts and retrieval settings |
| The model provider returns authentication or quota errors | Provider credentials for the selected embedding or generative model are missing, invalid, or exhausted | Reconnect the model provider account or secret in Lamatic, confirm quotas, and retry with valid configured models |
| The vector search layer returns connection errors | The selected vector database connector is unavailable or lacks credentials | Reconfigure the `vectorDB` connection, verify network and credential health, and confirm the target index exists |
| The user sends malformed or unsupported input from the client | The flow expects a text chat message but received an empty or invalid payload | Validate client-side message submission, ensure `chatMessage` is populated, and reject empty messages before invoking the flow |

## Notes
- This flow is intentionally narrow: it answers questions from indexed content but does not expose source references in the final response, even though retrieval is happening internally.
- Retrieval behavior is partly externalized into `@model-configs/knowledge-chatbot_rag.ts`, so practical answer quality depends on configuration values not shown directly in the flow graph, including retrieval limit, certainty behavior, memories, and message handling.
- The prompts are also external references, which means behavioral changes can be made without rewiring the graph, but prompt edits may materially change grounding quality and response style.
- Because the response node only returns generated text, developers who need citations, chunk metadata, or debug traces will need to extend the flow rather than rely on the current output contract.
- This flow is best treated as the serving layer of the bundle: ingestion freshness, chunking quality, and index hygiene in sibling flows directly determine how useful its answers will be.
# 2. Embedded Chatbot - Chatbot
A retrieval-augmented chat flow that answers end-user questions against indexed documents and serves as the response-generation stage of the broader Embedded Chat pipeline.

## Purpose
This flow is responsible for the conversational answering part of the Embedded Chat agent kit. Its job is to accept a chat message from an embedded chat widget, retrieve relevant document chunks from a configured vector database, and use those retrieved results to generate a grounded answer. In practical terms, it turns a free-form user question into a retrieval query and then into a final response suitable for immediate display in the chat UI.

The outcome of this flow is a model-generated answer returned directly to the invoking chat client. That matters because the wider system separates ingestion from answering: PDF and website indexation flows prepare the searchable knowledge base in advance, while this flow performs the live question-answering step over that indexed content. Without this flow, indexed vectors would exist but no user-facing conversational interface would transform retrieval results into helpful responses.

Within the broader pipeline described by the parent agent, this flow sits in the retrieve-and-synthesize phase. The upstream ingestion flows first extract, chunk, embed, and store content in the vector database. This chatbot flow then retrieves semantically relevant context from that store and synthesizes a final answer using a chat-capable generative model, optionally informed by configured memory and message settings referenced through the flow’s model configuration.

## When To Use
- Use when an end user submits a natural-language question through the embedded chat widget and the system should answer from previously indexed PDFs or webpages.
- Use when document ingestion has already completed and a vector database has been populated with embeddings for the target content set.
- Use when the desired response should be grounded in private or organization-specific knowledge rather than only the model’s general training data.
- Use when the caller needs a direct chat response payload that can be rendered immediately in a conversational UI.
- Use when the application wants Lamatic-managed retrieval and generation in a single flow invocation instead of implementing custom retrieval orchestration outside the flow.

## When Not To Use
- Do not use when the source documents have not yet been indexed; run the PDF or website indexation flows first so the vector database contains searchable content.
- Do not use when the task is to ingest new PDFs into the knowledge base; the `1A. Embedded Chatbot - PDF Indexation` flow handles that responsibility.
- Do not use when the task is to ingest website content from URLs; the website indexation flow is the correct sibling flow for that case.
- Do not use when the task is to remove outdated or non-compliant indexed resources; the resource deletion flow handles removal of vectors and metadata.
- Do not use when no vector database, embedding model, or generative model has been configured for the `RAG` node.
- Do not use when the input is not a chat message from the widget trigger shape expected by this flow.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `chatMessage` | `string` | Yes | The end-user’s message captured by the `Chat Widget` trigger and passed into retrieval as the semantic query. |
| `vectorDB` | `select` / vector database reference | Yes | The vector database instance that the `RAG` node will query for relevant document chunks. |
| `embeddingModelName` | `model` (`embedder/text`) | Yes | The embedding model used to convert the incoming question into vector space for similarity search. |
| `generativeModelName` | `model` (`generator/text`) | Yes | The chat-capable model used to generate the final answer from retrieved context and prompt instructions. |

The trigger-facing runtime payload is the user’s `chatMessage`, supplied by the chat widget. The remaining required values are flow configuration inputs bound to the `RAG` node rather than ad hoc end-user fields. The flow assumes the incoming message is plain text and semantically meaningful enough for retrieval. No explicit maximum length is declared here, but very long messages may degrade retrieval quality or increase model cost depending on the configured providers.

## Outputs
| Field | Type | Description |
|---|---|---|
| `modelResponse` | `string` | The final answer produced by the `RAG` node and returned to the chat client via the `Chat Response` node. |

The API response is effectively a single prose answer string intended for direct display in a chat interface. It is not a structured object in this flow definition, and no explicit citations, chunk metadata, or retrieval diagnostics are exposed by the response node. Completeness depends on the quality and availability of indexed content, retrieval settings, and the configured model behavior.

## Dependencies
### Upstream Flows
- `1A. Embedded Chatbot - PDF Indexation` must run before this flow when the knowledge source is one or more PDFs. It is responsible for extracting text, chunking content, generating embeddings, and storing vectors in the configured database that this flow later queries.
- The website indexation flow must run before this flow when the knowledge source is one or more webpages. It must have already crawled or extracted website content, chunked it, embedded it, and written it into the same or intended vector store.
- This flow does not directly consume named output fields from those sibling flows in its trigger payload. Instead, it depends on their side effect: a populated `vectorDB` containing embeddings and retrievable content relevant to the user’s question.
- As an execution entry point for chat interactions, this flow is directly invoked by the embedded chat UI once indexing prerequisites are satisfied.

### Downstream Flows
- No other Lamatic flow is shown as consuming this flow’s output in the provided kit context.
- The primary downstream consumer is the embedded chat frontend or any calling application that reads the returned `modelResponse` and renders it to the end user.

### External Services
- Chat widget trigger configuration — receives end-user chat input and domain/widget settings — required credential or environment variable: none specified inside this flow definition
- Vector database — stores and serves embedded document chunks for retrieval — required credential or environment variable: provider-specific credentials are configured through Lamatic, but no variable name is declared in this flow source
- Embedding model provider — embeds `chatMessage` for semantic search — required credential or environment variable: provider-specific credentials configured in Lamatic, no explicit variable name shown here
- Generative model provider — produces the grounded final answer — required credential or environment variable: provider-specific credentials configured in Lamatic, no explicit variable name shown here
- Lamatic platform runtime — orchestrates node execution, model loading, and flow invocation — required credential or environment variable: typically project/API credentials at deployment level, though not referenced by node name in this source

### Environment Variables
- No node in this flow explicitly references an environment variable by name in the provided TypeScript source.
- At deployment level, the surrounding application typically uses Lamatic project credentials such as `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` to invoke deployed flows, but these are used by the host application and platform integration rather than directly inside a named node in this flow.
- The parent kit README also references `EMBEDDED_CHATBOT_CHATBOT` as the deployed flow identifier used by the invoking application to call this flow; this is an integration variable outside the flow graph itself.

## Node Walkthrough
1. `Chat Widget` (`triggerNode`) starts the flow when an end user sends a message through the embedded chat interface. Its configuration points to the widget settings resource for chat behavior and allowed domains, and it exposes the incoming text as `triggerNode_1.output.chatMessage`.
2. `RAG` (`dynamicNode` using `RAGNode`) receives `{{triggerNode_1.output.chatMessage}}` in its `queryField` and performs the core retrieval-augmented generation step. It queries the configured `vectorDB`, uses the selected `embeddingModelName` to embed the question for similarity search, applies retrieval settings such as `limit` and `certainty` from the referenced model config, and then sends the retrieved context into the selected `generativeModelName` along with the configured prompts.
3. Inside `RAG`, the system behavior is shaped by the referenced `rag_system` prompt and the user-side prompt template `embedded_chatbot_chatbot_rag_user`. The node also references message and memory settings from the model config, indicating that conversational context handling is controlled centrally rather than inline in the flow definition.
4. `Chat Response` (`responseNode`) takes `{{RAGNode_711.output.modelResponse}}` and returns it as the flow’s final response payload to the calling chat client.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow returns no useful answer or says it cannot find relevant information | The `vectorDB` is empty, the required documents were never indexed, or the wrong database was selected | Run the appropriate indexation flow first and confirm the `RAG` node is pointed at the database containing the intended content |
| The flow fails before generation starts | `vectorDB`, `embeddingModelName`, or `generativeModelName` is not configured on the `RAG` node | Provide all required private inputs in Lamatic and redeploy the flow |
| Answers are generic and not grounded in documents | Retrieval is not returning relevant chunks due to poor embeddings, wrong model selection, or querying the wrong index | Verify the embedding model matches the indexed vectors, confirm the correct vector store is selected, and review retrieval configuration such as `certainty` and result `limit` |
| The chat UI sends a request but the flow does not receive the expected message text | The trigger payload shape is malformed or the widget integration is not supplying `chatMessage` correctly | Validate the chat widget configuration and ensure the incoming message is mapped to `triggerNode_1.output.chatMessage` |
| The flow errors with provider or authentication issues | Model provider credentials or vector database credentials are missing or invalid in Lamatic | Recheck the provider credentials configured for the selected models and database connection in the Lamatic project |
| The answer is empty or unusually brief | Retrieved context may be empty, prompt instructions may constrain output, or model limits may be too strict | Confirm that relevant content exists in the index, inspect the prompt resources, and review the referenced model configuration for retrieval and generation settings |
| The flow cannot answer questions about a newly uploaded PDF or website | Upstream ingestion has not completed yet, failed silently, or wrote to a different vector store | Verify the upstream indexation flow completed successfully and stored vectors in the same database this chat flow queries |
| The flow is callable from the app but not from the expected environment | The host application is using the wrong deployed flow ID such as an incorrect `EMBEDDED_CHATBOT_CHATBOT` value | Update the application environment to the correct deployed chatbot flow identifier |

## Notes
- This flow is intentionally narrow: it handles answering only, not content ingestion, content maintenance, or resource deletion.
- The flow’s behavior is heavily influenced by referenced assets rather than inline settings, especially `rag_system`, `embedded_chatbot_chatbot_rag_user`, and the `embedded-chatbot-chatbot_rag` model configuration. Changes to those referenced resources can materially alter response quality, retrieval strictness, and conversational behavior without changing the flow graph.
- Because the response node returns only `modelResponse`, downstream consumers that need citations, retrieved chunks, or debugging metadata would require changes to the flow or the response mapping.
- Performance and answer quality depend on the size and quality of the indexed corpus, the retrieval thresholds in the model config, and the latency characteristics of both the vector database and selected model providers.
- The chat widget trigger is the intended invocation surface in this definition, but the parent kit indicates the broader application can invoke the deployed flow by ID from a Next.js frontend or backend service.
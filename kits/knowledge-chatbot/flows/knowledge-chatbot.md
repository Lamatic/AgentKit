# Knowledge Chatbot
A contextual chat flow that answers user questions against an indexed knowledge base and serves as the query-time retrieval-and-generation interface in the wider RAG system.

## Purpose
This flow is responsible for the knowledge consumption side of the bundle. It accepts a user question from an embedded chat interface, converts that question into a retrieval query, searches a configured vector database for relevant indexed content, and uses a generative model to produce an answer grounded in the retrieved material. Its job is not to ingest or prepare knowledge; it assumes the knowledge base already exists and focuses on turning that indexed corpus into useful conversational responses.

The outcome of the flow is a chat response returned to the end user. That response is generated from retrieved context rather than relying only on general model memory, which improves relevance and reduces hallucination for organization-specific questions. This matters because the broader agent pipeline only becomes useful after the indexed content can be queried reliably by operators, customers, or internal users.

Within the larger RAG architecture described by the parent agent, this flow sits at the final retrieval-and-synthesis stage. Upstream indexation flows handle extraction, chunking, embedding, and storage of content from sources such as cloud drives, databases, and web crawls. Once those flows have populated the vector store, this flow performs the runtime sequence of receive question, retrieve relevant context, synthesize answer, and return the response through the chat widget.

## When To Use
- Use when a user asks a question that should be answered from content already indexed into the configured vector database.
- Use when you want to expose a conversational interface over your organization’s knowledge base through a Lamatic chat widget.
- Use when the relevant source material may come from multiple ingestion flows, but all of it has already been normalized and stored in a shared vector index.
- Use when the response should be grounded in retrieved context instead of relying on a general-purpose LLM alone.
- Use when you need a lightweight query-time flow rather than a content ingestion or indexing workflow.

## When Not To Use
- Do not use when the knowledge base has not yet been populated by one or more indexation flows; retrieval will have nothing meaningful to return.
- Do not use when the task is to ingest, crawl, scrape, chunk, embed, or index new content; one of the ingestion/indexation sibling flows is the correct choice.
- Do not use when no vector database has been configured for `RAGNode_711`; the core retrieval step cannot run without it.
- Do not use when the incoming payload is not a chat message or cannot be provided through the chat trigger’s `chatMessage` field.
- Do not use when the use case requires live public web search or fresh external data that is not yet present in the index.
- Do not use when you need a structured machine-action output rather than a conversational text answer; this flow returns chat content, not a task-oriented schema.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `chatMessage` | string | Yes | The end-user’s question captured by the chat widget trigger and passed into the retrieval query field. |
| `vectorDB` | select | Yes | The vector database connection or index to query for semantically relevant content. |
| `embeddingModelName` | `embedder/text` model | Yes | The embedding model used to convert the incoming question into vector space for similarity search. |
| `generativeModelName` | `generator/text` model | Yes | The text generation model used to synthesize the final answer from the retrieved context and prompt instructions. |

Below the table, notable constraints and assumptions:

- `chatMessage` is expected to be plain natural-language text from the chat widget.
- `vectorDB`, `embeddingModelName`, and `generativeModelName` are private configuration inputs on `RAGNode_711`, not user-visible chat fields.
- The selected embedding model must be compatible with the configured vector index and retrieval setup.
- The selected generative model must support prompt-based chat or text generation for grounded answer synthesis.
- This flow assumes the vector database already contains embedded content produced by upstream ingestion/indexation flows.

## Outputs
| Field | Type | Description |
|---|---|---|
| `content` | string | The generated answer returned to the chat client, sourced from `RAGNode_711.output.modelResponse`. |

Below the table, the output format in plain English:

- The response is a single prose chat message intended for direct display in the chat widget.
- The flow does not expose retrieved chunks, citations, scores, or references as separate response fields in its final response node.
- Completeness depends on retrieval quality, model behavior, and whether relevant source material exists in the configured vector database.
- If retrieval returns weak or no context, the generated answer may be brief, uncertain, or less useful depending on prompt and model behavior.

## Dependencies
### Upstream Flows
- This is an entry-point runtime flow for end-user questioning, but it depends on prior execution of one or more ingestion/indexation flows in the parent RAG bundle.
- Those upstream flows must have already extracted source content, split or normalized it as needed, embedded it, and written the embeddings plus associated content into the vector database selected by `vectorDB`.
- This flow does not directly consume named output fields from a specific sibling flow in its node graph; instead, it consumes the persisted indexed knowledge base those flows created.
- At execution time, the only direct trigger input it consumes is `triggerNode_1.output.chatMessage`, which is mapped into `RAGNode_711.data.values.queryField`.

### Downstream Flows
- No downstream Lamatic flows are defined in this flow graph.
- The immediate consumer of this flow’s output is the chat widget response channel, which receives the `content` value produced by `chatResponseNode_988`.
- In broader system terms, external applications embedding the chat widget may consume the returned answer for display, logging, or orchestration, but no additional chained flow is specified here.

### External Services
- Chat widget trigger service — receives end-user chat messages and hosts the conversational entry point — required credential or environment variable depends on Lamatic deployment and widget configuration.
- Vector database — stores and serves semantic retrieval results for indexed knowledge — required credential or environment variable depends on the selected `vectorDB` provider.
- Embedding model provider — converts the user query into an embedding for similarity search — required credential or environment variable depends on the selected `embeddingModelName` provider.
- Generative model provider — produces the final grounded answer from retrieved context and prompt instructions — required credential or environment variable depends on the selected `generativeModelName` provider.
- Prompt resources — `knowledge_chatbot_rag_system` and `knowledge_chatbot_rag_user` guide retrieval-aware answer generation — no separate credential, but they must exist in the flow package.

### Environment Variables
- `VECTOR_DB`-style provider-specific variables — credentials and connection settings for the selected vector store — used by `RAGNode_711`
- `LLM_API_KEY`-style provider-specific variables — authentication for the selected generative model provider — used by `RAGNode_711`
- `EMBEDDING_API_KEY`-style provider-specific variables — authentication for the selected embedding model provider — used by `RAGNode_711`
- Widget or Lamatic deployment variables as configured in the workspace — required to expose the chat trigger on approved domains — used by `triggerNode_1`

## Node Walkthrough
1. `Chat Widget` (`triggerNode`) starts the flow when an end user submits a message through the embedded chat interface. It captures the incoming question as `chatMessage` and makes it available to downstream nodes. The trigger is also linked to widget domain and chat configuration resources, which define how the chatbot is exposed.
2. `RAG` (`dynamicNode`) receives the user’s text from `{{triggerNode_1.output.chatMessage}}` through its `queryField`. It uses the configured `embeddingModelName` to embed the query, searches the selected `vectorDB` for semantically similar indexed content, applies the packaged system and user prompts, and then uses the configured `generativeModelName` to synthesize a contextual answer. Additional runtime behavior such as retrieval limit, certainty threshold, memory handling, and message settings are sourced from the referenced model config.
3. `Chat Response` (`dynamicNode`) takes `{{RAGNode_711.output.modelResponse}}` and returns it as the final chat payload. This is the user-visible response step. Although the node supports references, none are configured in this flow, so only the generated answer content is returned.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow fails before retrieval starts | `vectorDB`, `embeddingModelName`, or `generativeModelName` has not been configured in the private inputs for `RAGNode_711` | Configure all required private inputs and verify the selected providers are available in the workspace |
| The chat widget receives no useful answer | The vector database is empty, points to the wrong index, or upstream ingestion/indexation flows have not populated it | Run the appropriate ingestion/indexation flow first and confirm the expected documents were embedded into the same vector store this flow queries |
| Responses are generic or hallucinated | Retrieval returned weak matches, certainty settings are too permissive, or the indexed content does not contain the answer | Verify index quality, confirm document coverage, review the referenced model config for retrieval settings, and ensure the question aligns with available knowledge |
| The flow errors on model invocation | Missing or invalid provider credentials for the embedding or generative model | Add or correct the provider API keys or workspace credentials used by `RAGNode_711` |
| The flow triggers but no user message reaches the RAG node | The incoming request is malformed or the widget did not provide `chatMessage` as expected | Validate the chat widget setup, test the trigger payload, and ensure the user query is sent as a text message |
| The flow returns an empty or minimal answer | No relevant chunks met retrieval thresholds, the query is too vague, or the selected index does not contain matching content | Rephrase the query, broaden the indexed content, or adjust retrieval settings in the model config if appropriate |
| The chat widget is inaccessible or does not start the flow | Widget domain or trigger configuration is incorrect | Review the trigger resource referenced by `knowledge_chatbot_chat_widget` and confirm allowed domains and deployment settings |
| Answers appear outdated | Upstream content changed but the index was not refreshed | Re-run the relevant ingestion/indexation flow so the vector store reflects the latest source material |

## Notes
- This flow is intentionally narrow: it is a query-time interface over an already prepared knowledge base, not a full end-to-end ingestion pipeline.
- Retrieval behavior is partly defined in the referenced model config, including settings such as result limit, memory handling, message configuration, and certainty threshold. Those settings can materially affect answer quality even though they are not exposed as trigger-time inputs.
- The final response node does not emit explicit source references, even though the RAG process may have used retrieved passages internally. If surfaced citations are required, the response contract would need to be extended.
- Because the trigger is a chat widget, this flow is best suited for interactive user-facing experiences rather than batch querying.
- Performance depends on vector database latency, embedding model speed, and generative model response time. Large indexes or slower hosted models will increase end-user wait time.
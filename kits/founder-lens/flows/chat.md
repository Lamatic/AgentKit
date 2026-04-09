# Founder Lens - Chat
A RAG-powered interactive chat flow that answers founder follow-up questions using the stored founder brief and conversation memory, serving as the interactive retrieval layer after analysis has completed.

## Purpose
`Founder Lens - Chat` is responsible for turning a previously generated startup analysis into an interactive question-answering experience. Instead of forcing the system to rerun expensive web research each time a founder has a new question, this flow retrieves the stored brief from the vector database, combines it with relevant conversation history from semantic memory, and produces a grounded response to the founder's latest message.

The outcome is a concise but context-aware answer returned through the API, with the conversation then written back into memory for future turns. This matters because the broader Founder Lens system is intentionally split into two stages: an `Analyze` flow that performs heavy research and synthesis once, and a `Chat` flow that lets users interrogate that result iteratively. The chat experience is only useful if it stays anchored to the analyzed brief rather than drifting into generic advice, which is why retrieval and memory are core to this flow.

Within the wider pipeline described by the parent agent, this flow sits after the research-and-synthesis phase. The `Analyze` flow first produces and persists the founder brief into a vector index and Lamatic memory. This `Chat` flow then performs the retrieve-and-respond portion of the chain: it accepts a user message, normalizes it for safe retrieval, pulls both brief context and recent conversation context, synthesizes an answer with the chat model, optionally adds a warning for first-turn or thin-context situations, stores the exchange, and returns the final reply.

## When To Use
- Use when a founder has already run the analysis flow and wants to ask follow-up questions about the generated brief.
- Use when the question should be answered from stored startup-analysis context rather than by launching fresh web research.
- Use when the caller can provide a valid `userId` and `sessionId` that identify the stored brief and its conversation thread.
- Use for iterative conversations such as asking about the fatal flaw, competitors, GTM risks, market size implications, or strategic next steps based on the existing brief.
- Use when persistent conversation memory matters and the answer should reflect prior turns in the same chat session.

## When Not To Use
- Do not use before the `Founder Lens - Analyze` flow has produced and stored a founder brief for the same `userId` and `sessionId`.
- Do not use when the caller wants a new startup idea researched from scratch; that belongs to the `Analyze` flow.
- Do not use when the input payload does not include a textual `message`, `userId`, and `sessionId`.
- Do not use when the desired answer requires fresh live-web evidence beyond what was already indexed into the stored brief.
- Do not use for cross-session aggregation or multi-brief comparison unless the memory and vector records were intentionally written under the same identifiers and retrieval strategy.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `message` | `string` | Yes | The founder's latest chat message or question to answer. |
| `userId` | `string` | Yes | The user identifier used to scope retrieval of the stored founder brief and conversation-related records. |
| `sessionId` | `string` | Yes | The session identifier used to scope both brief retrieval and ongoing conversation memory for this analysis/chat thread. |

The trigger schema expects all three fields as strings. The flow assumes `userId` and `sessionId` are stable identifiers that match the records written by the upstream analysis and prior chat turns. The `message` should be natural-language text; the flow includes a safety/normalization step before retrieval, but it still assumes the field contains a user question rather than a structured object or binary payload.

## Outputs
| Field | Type | Description |
|---|---|---|
| `answer` | `string` | The final chat response generated for the founder, after any warning or context notice has been appended. |

The API response is a simple object containing a single prose answer. It is not a structured JSON analysis payload. The answer is generated from the stored brief plus conversation history, so completeness depends on whether the upstream analysis exists and whether retrieval returns enough relevant context for the current question.

## Dependencies
### Upstream Flows
- `Founder Lens - Analyze` must run before this flow for the same `userId` and `sessionId`.
  - It must have produced the founder brief and stored it in the configured vector database.
  - It must also have persisted memory artifacts needed for later conversational grounding.
  - This flow indirectly consumes those persisted outputs through retrieval, rather than receiving them as direct trigger fields.
- If prior chat turns exist, earlier executions of this same `Founder Lens - Chat` flow also act as upstream context because conversation history is retrieved from memory using the same identifiers.

### Downstream Flows
- No separate downstream Lamatic flow is indicated as consuming this flow's API output.
- The primary downstream consumer is the calling UI or API client, which uses the returned `answer` to render the chat response.
- Future executions of this same flow depend on the conversation state written by the `Memory Add - Store Conversation` node.

### External Services
- Vector database — used by `RAG - Retrieve Brief` to retrieve the stored founder brief for the current `userId` and `sessionId` — requires the vector DB connection configured in the `vectorDB` input for `RAGNode_brief`.
- Embedding model provider — used by `RAG - Retrieve Brief`, `Memory Retrieve - Conversation History`, and `Memory Add - Store Conversation` to embed queries and memory content — requires whichever provider credentials back the selected embedding models.
- Generative chat model provider — used by `RAG - Retrieve Brief` and `Founder Lens Chat` to generate retrieval-grounded text and the final response — requires whichever provider credentials back the selected chat models.
- Lamatic memory subsystem — used to retrieve prior conversation turns and store the latest exchange — requires the platform memory configuration associated with the referenced memory scripts.

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Required runtime secrets are provider- and connector-specific and are attached through selected model credentials and the configured vector database connection rather than named directly in this file.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives a realtime GraphQL/API payload with `message`, `userId`, and `sessionId`. This is the only external input to the flow and defines both the user question and the retrieval scope.

2. `Safe Message` (`codeNode`) transforms the raw `message` into `safeMessage`. The script is referenced as `@scripts/chat_safe-message.ts`, and its purpose in this flow is to sanitize or normalize the incoming user text before it is used as a retrieval query. That reduces the risk of passing malformed or unhelpful text directly into downstream retrieval logic.

3. From `Safe Message`, the flow fans out into two parallel retrieval paths.
   - `RAG - Retrieve Brief` (`RAGNode`) queries the configured vector database for the stored founder brief. Its query text is the sanitized `safeMessage`, and its filters explicitly constrain retrieval to records matching both `userId` and `sessionId`. It uses the system prompt `@prompts/chat_rag-retrieve-brief_system.md` plus model config from `@model-configs/chat_rag-retrieve-brief.ts` to fetch the most relevant brief content and produce retrieval outputs such as `references` and `modelResponse`.
   - `Memory Retrieve - Conversation History` (`memoryRetrieveNode`) retrieves prior chat memory for the same conversation using settings supplied by `@memory/chat_memory-retrieve-conversation-history.ts`. This gives the flow semantic access to relevant earlier turns, not just the current question.

4. `Context Manager` (`codeNode`) waits for both retrieval branches and then assembles the working context for the answering model. Using `@scripts/chat_context-manager.ts`, it produces `turnCount`, `briefContext`, `historyString`, `isFirstMessage`, and `conversationWarning`. In practical terms, this node decides how much prior history exists, converts retrieved memory into a prompt-friendly string, packages the brief context for the final model, and flags whether the conversation is effectively on its first turn or requires a warning.

5. `Founder Lens Chat` (`LLMNode`) generates the actual answer. It uses two prompt references: `@prompts/chat_founder-lens-chat_system.md` for system behavior and `@prompts/chat_founder-lens-chat_user.md` for the user-side prompt template. Its model configuration comes from `@model-configs/chat_founder-lens-chat.ts`. At this point, the model is expected to answer the founder's question using the assembled brief context and conversation history rather than generic world knowledge.

6. `Append Warning If Needed` (`codeNode`) combines the model's draft answer with any warning or advisory produced by `Context Manager`. The script `@scripts/chat_append-warning-if-needed.ts` outputs a single `finalAnswer`, allowing the flow to attach a context-related note only when needed instead of hardcoding one into every reply.

7. `Memory Add - Store Conversation` (`memoryNode`) persists the latest exchange using `@memory/chat_memory-add-store-conversation.ts`. This step writes the conversation back into memory with the appropriate `uniqueId`, `sessionId`, `memoryValue`, and collection configuration so future turns can retrieve it. This is what turns the flow into an ongoing chat experience rather than a stateless Q&A endpoint.

8. `API Response` (`graphqlResponseNode`) returns the final payload to the caller. The response mapping exposes a single field, `answer`, sourced from `codeNode_appendWarning.output.finalAnswer`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| The flow returns a vague or generic answer unrelated to the startup brief. | The upstream `Analyze` flow did not run, stored records are missing, or retrieval filters for `userId` and `sessionId` do not match the stored brief. | Run `Founder Lens - Analyze` first for the same identifiers, then retry with matching `userId` and `sessionId`. Verify the brief was written to the configured vector database. |
| The flow fails at brief retrieval. | `RAGNode_brief` has no valid `vectorDB` configured or the vector database connection/credentials are unavailable. | Configure the `vectorDB` input for `RAGNode_brief` and confirm the database connector is healthy and authorized. |
| The flow fails during memory retrieval or storage. | The memory subsystem is misconfigured, unavailable, or using an invalid embedding model configuration. | Verify the Lamatic memory setup, the referenced memory scripts, and the embedding model credential attached to `memoryRetrieveNode_chat` and `memoryNode_storeChat`. |
| The flow fails with a model-selection or authorization error. | Required chat or embedding models were not selected, or their provider credentials are missing/invalid. | Supply valid `embeddingModelName` and `generativeModelName` values for the relevant nodes and confirm the backing provider credentials are configured. |
| The answer omits prior context from earlier turns. | Conversation memory retrieval returned no results, often because `sessionId` changed or prior messages were not stored successfully. | Reuse the same `sessionId` across chat turns and confirm that `Memory Add - Store Conversation` completed successfully in previous runs. |
| The flow returns little or no useful brief context. | The sanitized query did not match indexed brief content well, or the brief itself was sparse. | Ask a more specific question, inspect the stored analysis quality, and if necessary rerun the `Analyze` flow to generate a stronger brief before chatting. |
| The API call is rejected or downstream nodes behave unexpectedly. | The trigger payload is malformed, missing one of `message`, `userId`, or `sessionId`, or using non-string values. | Send a payload that matches the trigger schema exactly, with all three fields present as strings. |
| The response includes a warning or qualification instead of a confident answer. | `Context Manager` identified that this is effectively a first message or that available conversation context is thin. | Treat the warning as a signal that the flow has limited prior conversational grounding; continue the conversation or ensure the upstream analysis and stored context exist. |

## Notes
- The flow is intentionally stateful across turns even though its API contract is minimal. Stable `userId` and `sessionId` values are therefore operationally critical.
- Retrieval is split between two stores with different purposes: the vector database holds the analyzed founder brief, while Lamatic memory holds conversational history. Both need to work for the best answers.
- Because the flow responds from stored analysis rather than live browsing, it is fast and repeatable but may become stale if the market changes after the original analysis was generated.
- The source references prompts, scripts, model configs, and memory helpers indirectly. Their exact wording and heuristics shape answer style, warning behavior, memory selection, and storage format even though those details are abstracted out of the flow definition.
- The trigger is configured as `realtime`, so this flow is designed for interactive chat UX rather than long-running background execution.
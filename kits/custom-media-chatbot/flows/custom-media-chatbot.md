# Custom Media Chatbot
A chat-triggered document question-answering flow that extracts content from a media file and generates grounded responses, serving as the single end-user interaction pipeline in this agent system.

## Purpose
This flow is responsible for turning a document or media file into an interactive chat experience. It accepts a user message through a chat interface, extracts readable content from a configured source file, reshapes that content into prompt-ready text, and asks an LLM to answer the user based on that extracted material. Its job is not general conversation or broad retrieval across many sources; it is focused, document-grounded answering against one media asset.

The outcome of the flow is a natural-language response returned directly to the chat client. That matters because this template’s value lies in letting users ask questions about file contents without building a separate ingestion, indexing, or retrieval stack. For support, sales, and lightweight knowledge assistance scenarios, this provides a fast path from static content to an operational chatbot.

Within the broader agent architecture, this flow is both the entry point and the synthesis layer. According to the parent agent context, the wider system is a single-flow pipeline rather than a multi-flow plan-retrieve-synthesize graph. In practice, it still follows that pattern internally: the chat trigger captures intent, file extraction retrieves usable document text, the code step normalizes that text, and the LLM synthesizes the final answer before the flow returns it to the chat widget.

## When To Use
- Use when a user asks a question that should be answered from the contents of a specific document or media file rather than from open-ended model knowledge.
- Use when the interaction begins in the Lamatic Chat Widget or an equivalent interface that can send the same chat-trigger payload.
- Use when the source knowledge is a supported file type such as `text`, `JSON`, `HTML`, or `PDF`.
- Use when you want a ready-made document chat experience without introducing a vector database, chunk retrieval layer, or separate indexing flow.
- Use when the authoritative answer is expected to come from one file’s extracted text and grounded generation is more important than broad discovery.
- Use for lightweight support or sales enablement cases where a single uploaded or configured file should drive the assistant’s answers.

## When Not To Use
- Do not use when the task requires searching across many documents, repositories, or indexed knowledge bases; a retrieval-oriented flow would be more appropriate.
- Do not use when no file is available, no file URL is configured, or the source document cannot be extracted into text.
- Do not use when the input is an unsupported media type or a binary asset with no meaningful text extraction path.
- Do not use when the answer must come from live external systems, current web data, or transactional APIs rather than static file content.
- Do not use when you need strict structured output contracts beyond a chat response unless the prompts and downstream handling have been extended for that purpose.
- Do not use a sibling flow instead because the parent agent defines this as a single-flow template; there is no separate specialized sibling flow in the provided kit.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `chatMessage` | `string` | Yes | The end user’s question or message submitted through the chat trigger. |
| `file` | `binary` or `file reference` | Expected by design | The document or media file whose content should ground the answer. In this exported flow, the extraction node is configured with a fixed `fileUrl`, but the agent design indicates the flow is intended to operate on a user-provided file or equivalent file reference. |
| `session metadata` | `object` | No | Optional chat/session fields supplied by the widget or invoking client, such as conversation identifiers or other trigger metadata. |

This flow has no declared private `inputs` object in its TypeScript definition, so trigger-time data is supplied through the chat interface rather than named flow inputs. The key practical requirement is that the user provides a meaningful `chatMessage` and that the extraction stage can access a valid supported file. The configured extraction node currently points to a PDF URL and is set to `format` `pdf`, which means implementations should confirm whether they are using the static URL as shipped or overriding it with runtime file input.

## Outputs
| Field | Type | Description |
|---|---|---|
| `content` | `string` | The final assistant reply returned by the `Chat Response` node, sourced from `LLMNode_919.output.generatedResponse`. |

The response is a single chat message in prose, suitable for direct rendering in a conversational interface. It is not returned as a structured object with citations, extraction metadata, or confidence fields. Completeness depends on the quality and size of the extracted text, the prompt design, and any token limits enforced by the configured model.

## Dependencies
### Upstream Flows
- None. This is the standalone entry-point flow for the template and is invoked directly by the `Chat Widget` trigger.
- Operationally, it assumes the trigger payload contains the user’s message and access to the target file, but no prior Lamatic flow must run before it.

### Downstream Flows
- None. The provided agent context describes a single-flow template, and this flow returns its answer directly to the chat interface.
- If embedded into a larger orchestration later, downstream consumers would typically use the final `content` response emitted by the `Chat Response` node.

### External Services
- Lamatic Chat Widget trigger — receives end-user chat messages and session context — credential handled by Lamatic runtime/workspace configuration.
- Lamatic file extraction capability via `extractFromFileNode` — parses the configured or supplied file into text-bearing output — credential handled by Lamatic runtime/workspace configuration.
- Configured LLM provider via `Generate Text` model config — generates the final grounded answer from prompts plus extracted context — required credential depends on the model provider referenced by `@model-configs/custom-media-chatbot_generate-text.ts`.

### Environment Variables
- `LLM provider credentials` — authenticate the model used by `Generate Text` — used by the `Generate Text` node through `@model-configs/custom-media-chatbot_generate-text.ts`.
- `Provider-specific model environment variables` — any API keys, endpoints, deployment names, or regions required by the selected model backend — used by the `Generate Text` node through `@model-configs/custom-media-chatbot_generate-text.ts`.

## Node Walkthrough
1. `Chat Widget` (`triggerNode`) starts the flow when a user sends a message in the chat interface. It is the public entry point for the workflow and supplies the conversational request context, including the user’s question and any widget/session metadata available at invocation time.

2. `Extract from File` (`extractFromFileNode`) reads the source document and converts it into machine-usable extracted content. In the exported configuration, it is explicitly set to `format` `pdf`, uses the fixed `fileUrl` `https://www.nielit.gov.in/sites/default/files/ccc_syllabus_0.pdf`, and joins pages into a single extraction stream. This means the flow, as currently configured, answers questions against that PDF unless the deployment adapts the node to use a runtime file supplied by the chat trigger.

3. `Text Extraction` (`codeNode`) runs the referenced script `@scripts/custom-media-chatbot_text-extraction.ts` to normalize the extractor’s output into text the LLM can consume cleanly. This is the bridge between raw parser output and prompt-ready context, and it likely handles flattening, cleanup, or field selection so the next step receives a coherent document text block rather than extractor-native structures.

4. `Generate Text` (`LLMNode`) sends the user’s request plus the extracted document context to the configured language model. It uses both a system prompt and a user prompt from the referenced prompt files, and its model, message, and memory behavior are driven by `@model-configs/custom-media-chatbot_generate-text.ts`. This node is where the actual grounded answer is synthesized.

5. `Chat Response` (`chatResponseNode`) returns `{{LLMNode_919.output.generatedResponse}}` back to the chat client as the visible assistant message. The response edge from the trigger to this node marks it as the formal response target for the chat session.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Chat request reaches the flow but no answer is returned | The `Generate Text` node failed due to missing or invalid model credentials | Verify the API key, endpoint, deployment, and any other provider-specific settings referenced by `@model-configs/custom-media-chatbot_generate-text.ts`. |
| The assistant replies with irrelevant or generic information | The prompt did not receive usable extracted context, or the configured file is not the intended source document | Confirm that `Extract from File` is reading the correct file and that `Text Extraction` is passing the normalized document text into the LLM step. |
| The flow returns an empty or very thin answer | The source file was empty, extraction produced no text, or the document content was largely non-textual | Test extraction separately, switch to a supported text-bearing file, or enhance the extraction script to handle the file structure more robustly. |
| The flow answers questions about the wrong document | The extraction node is hard-coded to the exported `fileUrl` rather than using a runtime user-provided file | Reconfigure `Extract from File` so the `fileUrl` or file input is mapped from trigger payload data instead of the static PDF URL. |
| Extraction fails on upload or parsing | The file type is unsupported, corrupted, password-protected, or mismatched with the configured `format` | Validate the file type before invocation, ensure it is readable, provide a password if required, and align the node’s extraction format with the actual document type. |
| The response is cut off or incomplete | The extracted document is too large for the configured model context window or response token budget | Add chunking/retrieval, reduce source size, summarize upstream, or increase model/context limits in the model configuration if supported. |
| The chat widget works in preview but fails in deployment | Widget domain or deployment settings are misconfigured | Review the widget trigger configuration in `@triggers/widgets/custom-media-chatbot_chat-widget.ts` and ensure the deployed environment allows requests from the expected domains. |
| A larger orchestration expects prior outputs that are not present | Another system invoked this flow as if it were downstream of an upstream retrieval or planning stage | Treat this flow as an entry-point flow, or adapt the trigger contract so the necessary message and file inputs are explicitly supplied by the calling system. |

## Notes
- The shipped flow contains no declared private inputs, so most runtime behavior is encoded in node configuration and referenced assets rather than in a strongly typed external input schema.
- There is a notable implementation tension between the parent agent description, which frames this as a user-file-driven chatbot, and the exported node config, which hard-codes a specific PDF URL. Developers should decide whether the production behavior is fixed-document chat or true uploaded-document chat and wire the extraction node accordingly.
- The extraction node is configured with `joinPages` enabled and `returnRawText` disabled, which suggests the downstream code script is expected to work with structured extraction output rather than untouched raw OCR/text.
- This flow does not implement retrieval augmentation, chunk ranking, or citation generation. For larger or more complex documents, answer quality may degrade unless the flow is extended with document segmentation and retrieval logic.
- Because the final response is plain chat text, any application that requires machine-readable output, audit fields, or source attribution will need additional prompt and response-shaping work.
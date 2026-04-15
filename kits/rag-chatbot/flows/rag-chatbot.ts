/*
 * # RAG Chatbot
 * A retrieval-augmented chat flow that accepts a user message, retrieves relevant documentation context, and returns a grounded answer as the entry-point support interaction in the wider agent system.
 *
 * ## Purpose
 * This flow is responsible for turning a free-form user support question into a documentation-grounded answer. Instead of relying on the language model alone, it routes the incoming chat message through a retrieval step so the response is based on material already present in the configured knowledge base. In practice, this makes the flow suitable for FAQ, product support, internal enablement, and other documentation-heavy use cases where correctness matters more than open-ended creativity.
 *
 * The outcome of the flow is a single assistant response suitable for immediate display in a chat interface. That outcome matters because it gives the broader agent system a reliable first-line answerer: one that can respond quickly, consistently, and with better alignment to the organization’s documented source of truth. In a support-oriented pipeline, this reduces repeated manual answers and helps contain hallucinations by anchoring generation on retrieved passages.
 *
 * Within the broader plan-retrieve-synthesize pattern described by the parent agent, this flow combines retrieval and synthesis in one execution path. It is the primary user-facing entry point rather than a mid-pipeline helper: a user asks a question through the chat widget, the `RAG` node retrieves relevant context from the indexed documentation, and the flow synthesizes the final answer before returning it directly to the client.
 *
 * ## When To Use
 * - Use when a user sends a natural-language question through the configured chat widget.
 * - Use when the answer should come from an indexed documentation or knowledge-base corpus rather than from general model knowledge.
 * - Use when you want a support-style assistant that can respond directly in a conversational UI.
 * - Use when the request is informational, explanatory, or procedural and the relevant material is expected to exist in the context database.
 * - Use when you want retrieval and answer generation handled in a single flow without additional orchestration steps.
 * - Use when an external system can invoke the same chat trigger endpoint with a user message compatible with the widget contract.
 *
 * ## When Not To Use
 * - Do not use when no knowledge base, vector index, or RAG configuration has been set up for the `RAG` node.
 * - Do not use when the request requires taking actions in other systems, such as creating tickets, modifying records, or triggering operational workflows.
 * - Do not use when the input is not a chat-style text message.
 * - Do not use when the user needs an answer based on live public web data unless that information has already been ingested into the underlying context database.
 * - Do not use when another flow is responsible for tool use, transactional operations, or multi-step planning beyond simple retrieve-and-answer behavior.
 * - Do not use when upstream systems expect a structured payload such as JSON fields or classifications rather than a single conversational response.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `chatMessage` | `string` | Yes | The end user’s message captured by the `Chat Widget` trigger and passed into retrieval as the search and answer-generation query. |
 * | `conversationId` | `string` | No | A session or conversation identifier that may be supplied by the chat trigger implementation to maintain continuity across messages. |
 * | `history` | `array` | No | Prior conversation turns if provided by the trigger or chat client and supported by the configured message memory settings. |
 * | `metadata` | `object` | No | Optional channel, user, or widget context that may accompany the trigger invocation depending on the chat widget configuration. |
 *
 * The flow’s exported `inputs` object is empty because it is trigger-driven rather than manually parameterized, but the trigger contract clearly expects a chat payload. The only field directly referenced in the flow definition is `triggerNode_1.output.chatMessage`, which means a non-empty user message is the practical minimum input requirement. Input text should be plain natural language. No explicit max length, language restriction, or schema validation is encoded in the flow source, so operational limits depend on the chat trigger, model configuration, and retrieval backend.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `content` | `string` | The final assistant reply returned by the `Chat Response` node, sourced from `RAGNode_919.output.modelResponse`. |
 * | `modelResponse` | `string` | The generated answer produced by the `RAG` node before it is wrapped for chat response delivery. |
 *
 * The response delivered to the chat client is a single prose message, not a structured record. Internally, the `RAG` node produces `modelResponse`, and the `Chat Response` node forwards that text as the outgoing chat content. Completeness depends on retrieval quality, prompt design, document coverage, and model limits; if relevant context is missing or truncated upstream, the final answer may be partial or may fall back to a lower-confidence response.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow. No Lamatic flow must run before it.
 *
 * At runtime, it does depend on an upstream interaction event: the `Chat Widget` trigger must have already received a user message and produced `chatMessage` for the `RAG` node to consume as `queryField`.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are defined as consumers of this flow’s output.
 *
 * The response is returned directly to the invoking chat client through the trigger-response path, so the effective downstream consumer is the user interface or any external caller using the same chat trigger endpoint.
 *
 * ### External Services
 * - Chat widget trigger service — receives user messages and initiates flow execution — credentials and host configuration depend on Lamatic trigger deployment and widget setup
 * - Embedding model provider — converts the user query into embeddings for retrieval — required credentials are defined by the referenced model configuration used by `RAG`
 * - Vector database or retrieval backend — finds relevant context documents for the query — required credentials depend on the RAG backend configured behind `@model-configs/rag-chatbot_rag.ts`
 * - Generative language model provider — synthesizes the final answer from the user query and retrieved context — required credentials are defined by the referenced model configuration used by `RAG`
 *
 * ### Environment Variables
 * - `EMBEDDING_MODEL` — selects or configures the embedding model used for retrieval — used by the `RAG` node through `@model-configs/rag-chatbot_rag.ts`
 * - `GENERATIVE_MODEL` — selects or configures the chat/completion model used to generate the answer — used by the `RAG` node through `@model-configs/rag-chatbot_rag.ts`
 * - `VECTOR_DB_*` — connection details for the vector store or retrieval service — used by the `RAG` node through its referenced RAG configuration
 * - `LLM_PROVIDER_*` — provider credentials such as API keys or endpoints for the generation model — used by the `RAG` node through its referenced model configuration
 * - `LAMATIC_TRIGGER_*` — deployment or runtime settings required for the hosted chat trigger and widget — used by the `Chat Widget` trigger node
 *
 * The exact environment variable names are not declared in this flow source. They are inferred from the referenced trigger and model configuration files, so implementers should treat the items above as configuration categories that must be resolved in those referenced resources.
 *
 * ## Node Walkthrough
 * 1. `Chat Widget` (`chatTriggerNode`) receives an inbound chat message from the configured widget or compatible trigger endpoint. This node starts the flow and exposes the user’s message as `chatMessage`, which becomes the canonical query used by the rest of the pipeline. Its widget/domain behavior is defined in the referenced trigger file `@triggers/widgets/rag-chatbot_chat-widget.ts`.
 *
 * 2. `RAG` (`RAGNode`) takes `{{triggerNode_1.output.chatMessage}}` as `queryField` and performs the core retrieval-augmented generation step. It uses the referenced model configuration for retrieval settings such as `limit`, `certainty`, memory/message handling, embedding model, and generative model. It also applies the system prompt from `@prompts/rag-chatbot_rag_system.md`, which instructs the model to answer using the retrieved relevant context. The result of this node is `modelResponse`, a grounded natural-language answer based on the indexed documentation.
 *
 * 3. `Chat Response` (`chatResponseNode`) maps `{{RAGNode_919.output.modelResponse}}` into the outgoing response content and returns it across the response edge associated with the original trigger. This is the final user-visible step: whatever text the `RAG` node produced becomes the assistant message shown in the chat client.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | The flow starts but no answer is returned | The `Chat Widget` trigger did not provide a usable `chatMessage`, or the input payload does not match the trigger contract | Verify the widget or caller is sending a non-empty text message and that the trigger exposes it as `chatMessage` |
 * | The assistant returns a generic, weak, or ungrounded answer | Retrieval returned little or no relevant context, or the knowledge base is incomplete | Check vector index population, document ingestion quality, retrieval settings such as `limit` and `certainty`, and whether the needed documentation exists in the corpus |
 * | The flow errors during retrieval or generation | Missing or invalid provider credentials in the model or vector-store configuration | Confirm all API keys, endpoints, and provider settings referenced by `@model-configs/rag-chatbot_rag.ts` are present and valid |
 * | The response is empty even though the flow executed | The `RAG` node failed to produce `modelResponse`, or the model output was blocked/truncated | Inspect `RAG` node logs, verify model quotas and token limits, and confirm the prompt/configuration are valid |
 * | The flow cannot access the retrieval backend | Vector database connection details are missing, incorrect, or the backend is unavailable | Validate vector store credentials, network access, index name/collection configuration, and service health |
 * | Conversation continuity is inconsistent across turns | Memory or message history settings in the referenced RAG configuration are not aligned with the trigger payload | Review how `memories` and `messages` are configured in `@model-configs/rag-chatbot_rag.ts` and ensure the chat client passes any required session context |
 * | The flow is invoked by another system and fails unexpectedly | An upstream caller assumed a different input contract or expected structured output | Align the caller to the chat-trigger input shape and expect a plain text conversational response rather than a structured object |
 * | The flow is selected for a task it cannot perform | The request actually requires transactional actions, tool execution, or live external data not present in the index | Route those requests to a more appropriate operational or tool-using flow, or enrich the knowledge base before using this flow |
 * | The flow appears to depend on prior orchestration that never happened | A calling system treated this as a downstream step instead of a standalone entry-point trigger flow | Invoke this flow directly from the chat widget or compatible trigger endpoint; do not require a prior Lamatic flow unless your own integration adds one |
 *
 * ## Notes
 * - The flow contains only three nodes and no branching logic, so its behavior is intentionally narrow: receive a message, retrieve context, generate an answer, return the answer.
 * - The `RAG` node is almost entirely configuration-driven. Retrieval quality, memory behavior, answer style, and model/provider selection are controlled through the referenced prompt and model configuration files rather than inline flow logic.
 * - No explicit fallback path is defined for cases where retrieval finds no useful context. If you need deterministic handling for “no answer found,” that behavior must be added in the prompt, node config, or a wrapper flow.
 * - The flow metadata advertises this as a support-oriented startup template, which is consistent with using it as a first-response documentation assistant rather than a general-purpose autonomous agent.
 * - Because the trigger reference points to a widget configuration file, deployment readiness includes both model/backend credentials and correct chat widget/domain setup.
 */

// Flow: rag-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "RAG Chatbot",
  "description": "This flow builds a chatbot that answers questions based on a context database containing all relevant information. User queries are answered using the existing documentation.",
  "tags": [
    "📞 Support",
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/rag-chatbot",
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
    "rag_chatbot_rag_system": "@prompts/rag-chatbot_rag_system.md"
  },
  "modelConfigs": {
    "rag_chatbot_rag": "@model-configs/rag-chatbot_rag.ts"
  },
  "triggers": {
    "rag_chatbot_chat_widget": "@triggers/widgets/rag-chatbot_chat-widget.ts"
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
        "domains": "@triggers/widgets/rag-chatbot_chat-widget.ts"
      }
    }
  },
  {
    "id": "RAGNode_919",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/rag-chatbot_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/rag-chatbot_rag_system.md"
          }
        ],
        "memories": "@model-configs/rag-chatbot_rag.ts",
        "messages": "@model-configs/rag-chatbot_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/rag-chatbot_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/rag-chatbot_rag.ts",
        "generativeModelName": "@model-configs/rag-chatbot_rag.ts"
      }
    }
  },
  {
    "id": "chatResponseNode_988",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "nodeName": "Chat Response",
        "content": "{{RAGNode_919.output.modelResponse}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_919",
    "source": "triggerNode_1",
    "target": "RAGNode_919",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_919-chatResponseNode_988",
    "source": "RAGNode_919",
    "target": "chatResponseNode_988",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-chatResponseNode_988",
    "source": "triggerNode_1",
    "target": "chatResponseNode_988",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

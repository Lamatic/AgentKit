/*
 * # Legal RAG Chatbot
 * A retrieval-augmented legal research flow that accepts a chat-style legal query, searches a connected legal corpus, and returns an informational response for use as the kit’s primary answer-generation path.
 *
 * ## Purpose
 * This flow is responsible for the core legal research task in the Legal Assistant kit: taking a user’s legal question, grounding it in a connected legal corpus, and producing a research-style answer rather than a freeform general response. In practice, the application packages the user’s `jurisdiction`, `context`, and `question` into a single Lamatic `chatMessage`, and this flow uses that message as the retrieval query. Its job is to turn that combined legal prompt into a corpus-backed answer that is suitable for legal research support.
 *
 * The outcome is a single generated response returned through the chat response channel. According to the flow metadata and kit design, that response is expected to be informational only and to include citations, practical next steps, and a non-advice framing. This matters because the wider system is designed to reduce ambiguity and overconfident legal output by anchoring answers in indexed legal materials such as statutes, regulations, policy manuals, case summaries, or research memos.
 *
 * In the broader pipeline, this is the main retrieval-and-synthesis flow. It sits at the point where user intent has already been captured by the UI or backend route and does not depend on any prior Lamatic flow to prepare its inputs. The web application is the normal upstream invoker: it gathers the legal research inputs, formats them into a Lamatic-compatible `chatMessage`, executes the deployed flow by ID, and then uses this flow’s generated response as the basis of the final application payload returned to the user.
 *
 * ## When To Use
 * - Use when a user asks a legal research question that should be answered against a Lamatic-connected legal corpus rather than from the model’s general knowledge.
 * - Use when the request includes or can be packaged with legal framing details such as `jurisdiction`, factual `context`, and a specific legal `question`.
 * - Use when the goal is an informational, citation-backed legal research response with practical next steps and a visible non-advice posture.
 * - Use when your Lamatic project has a legal knowledge base, vector store, or indexed corpus already connected to the `RAG` node in this flow.
 * - Use when the included web UI or backend `POST /api/legal` route is invoking the deployed legal assistant flow.
 * - Use when this flow is serving as the kit’s primary entry-point for answering legal questions interactively through the chat widget trigger.
 *
 * ## When Not To Use
 * - Do not use when no legal corpus or vector-backed knowledge source has been connected to the `RAG` node; without retrieval data, the flow cannot perform its intended function reliably.
 * - Do not use when the input is not a chat-style message or cannot be converted into a Lamatic `chatMessage` compatible with the `Chat Widget` trigger.
 * - Do not use when the user needs formal legal advice, legal representation, or a privileged attorney-client interaction; this flow is designed for informational research support only.
 * - Do not use when the request is purely operational and unrelated to legal research, such as account management, deployment administration, or non-legal application support.
 * - Do not use when another system should answer from a different source of truth, such as a public-web search flow for current external information not present in the connected corpus.
 * - Do not use when required application-level inputs such as `jurisdiction`, `context`, and `question` are missing to the point that the packaged `chatMessage` would be too incomplete to retrieve useful legal material.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `chatMessage` | `string` | Yes | The chat payload received by the `Chat Widget` trigger and passed into retrieval via `triggerNode_1.output.chatMessage`. In this kit, the backend typically constructs it from the user’s `jurisdiction`, `context`, and `question`. |
 *
 * Below the trigger level, the kit expects the application to collect three conceptual inputs before invoking the flow:
 *
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `jurisdiction` | `string` | Yes at application level | The legal jurisdiction that should frame the answer, such as a state, country, or other legal system. This is not a separate Lamatic trigger field in the flow source, but is expected to be embedded into `chatMessage`. |
 * | `context` | `string` | Yes at application level | The factual background, procedural posture, or scenario details the answer should assume. This is packaged into `chatMessage` by the invoker. |
 * | `question` | `string` | Yes at application level | The specific legal research question the user wants answered. This is packaged into `chatMessage` by the invoker. |
 *
 * The flow source defines no explicit typed input schema beyond the chat trigger, so validation is largely an application responsibility. The most important assumption is that `chatMessage` contains enough legal context to support retrieval, ideally including jurisdiction, material facts, and a clearly phrased question in plain language. There is no documented max length in the flow source, but excessively vague or excessively long messages may reduce retrieval quality or cause model truncation depending on the configured model settings.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `content` | `string` | The chat response returned by the `Chat Response` node, sourced directly from `RAGNode_919.output.modelResponse`. |
 * | `modelResponse` | `string` | The generated answer produced by the `RAG` node before it is forwarded to the response node. This is the effective payload the flow returns to the caller through the chat response path. |
 *
 * The output is a single prose response, not a multi-field structured legal analysis object at the flow level. In this kit, downstream application code may reshape that response into a higher-level API payload such as `answer`, `disclaimer`, and `jurisdiction`, but the flow itself emits the generated chat content as plain text. Completeness depends on the connected corpus, the prompt, and the model configuration; if retrieval is weak or empty, the returned answer may be limited, generic, or less citation-rich than intended.
 *
 * ## Dependencies
 * ### Upstream Flows
 * This is a standalone entry-point flow within the Legal Assistant kit. No other Lamatic flow must run before it.
 *
 * Upstream at the application level, the included web UI and backend `POST /api/legal` route gather and normalize:
 * - `jurisdiction`
 * - `context`
 * - `question`
 *
 * They package those values into the Lamatic-compatible `chatMessage` consumed by `Chat Widget`. That packaging step is required for correct invocation, but it is not implemented as a separate Lamatic flow.
 *
 * ### Downstream Flows
 * No downstream Lamatic flows are defined in the provided kit materials.
 *
 * At the application level, the backend route consumes this flow’s generated response text and may map it into a higher-level API response object for the frontend. In the README example, the application returns:
 * - `answer`
 * - `disclaimer`
 * - `jurisdiction`
 *
 * Of those, only the answer text originates directly from this flow.
 *
 * ### External Services
 * - Lamatic chat trigger service — receives the inbound chat invocation and provides `chatMessage` to the flow — required project/API access configured outside the flow
 * - Lamatic RAG runtime — performs retrieval and answer generation inside the `RAG` node — requires a deployed Lamatic project and a connected legal corpus
 * - Connected legal vector store or indexed corpus — supplies retrieval context for statutes, regulations, policies, case summaries, or research notes — configured on the `RAG` node in Lamatic Studio
 * - Embedding model referenced by `@model-configs/legal-rag-chatbot_rag.ts` — converts the query into embeddings for retrieval — credentialing/configuration managed by Lamatic model setup
 * - Generative model referenced by `@model-configs/legal-rag-chatbot_rag.ts` — drafts the final answer from the prompt and retrieved context — credentialing/configuration managed by Lamatic model setup
 *
 * ### Environment Variables
 * - `ASSISTANT_LEGAL_CHATBOT` — stores the deployed flow ID used by the application to invoke this flow — used outside the flow by the kit’s backend/API invoker
 * - `LAMATIC_API_URL` — identifies the Lamatic API base URL for executing the deployed flow — used outside the flow by the kit’s backend/API invoker
 * - `LAMATIC_PROJECT_ID` — identifies the Lamatic project containing the deployed flow — used outside the flow by the kit’s backend/API invoker
 * - `LAMATIC_API_KEY` — authenticates API calls to Lamatic when the application executes the deployed flow — used outside the flow by the kit’s backend/API invoker
 *
 * ## Node Walkthrough
 * 1. `Chat Widget` (`triggerNode`) receives the incoming chat turn. In this flow, it is the entry point and provides `triggerNode_1.output.chatMessage`, which contains the user’s legal research request. In the broader kit, that message is typically assembled from the UI’s `jurisdiction`, `context`, and `question` fields before invocation.
 *
 * 2. `RAG` (`dynamicNode`) takes `{{triggerNode_1.output.chatMessage}}` as its `queryField` and performs retrieval-augmented generation against the connected legal corpus. It uses the system prompt referenced at `@prompts/legal-rag-chatbot_rag_system.md` plus model settings from `@model-configs/legal-rag-chatbot_rag.ts`, including retrieval `limit`, `certainty`, memory/message handling, and the selected embedding and generative models. Its job is to retrieve relevant legal material and synthesize a response in the expected legal research style.
 *
 * 3. `Chat Response` (`dynamicNode`) returns the generated answer to the caller. It does not transform the content further; it simply maps `{{RAGNode_919.output.modelResponse}}` into the final response channel so the invoking widget or API caller receives the RAG-generated text.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow invocation fails before any answer is returned | Missing or invalid `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, or `LAMATIC_API_URL` in the application environment | Verify the application `.env` values, confirm the Lamatic project is reachable, and re-run the request with valid credentials. |
 * | Application cannot invoke the intended deployed flow | `ASSISTANT_LEGAL_CHATBOT` is missing, incorrect, or points to an undeployed/outdated flow version | Update `ASSISTANT_LEGAL_CHATBOT` with the correct deployed flow ID from Lamatic Studio and ensure the latest flow has been deployed. |
 * | Response is empty, generic, or lacks citations | The `RAG` node is not connected to a legal corpus, the corpus is sparse, or retrieval settings are not appropriate | Connect a valid legal knowledge source to the `RAG` node, verify indexing completed successfully, and review the referenced model configuration for retrieval settings such as `limit` and `certainty`. |
 * | Response is irrelevant to the jurisdiction or facts | The packaged `chatMessage` omitted `jurisdiction`, `context`, or key factual details | Ensure the upstream API route includes all three conceptual inputs in the composed chat message and that they are clearly labeled or phrased. |
 * | Trigger receives input but retrieval quality is poor | The user message is too vague, malformed, or not framed as a legal research query | Strengthen input validation upstream and require a structured request containing jurisdiction, factual context, and a specific legal question. |
 * | Flow returns a response, but application-level fields such as `disclaimer` are missing | The flow returns plain text only; formatting into a richer API response is handled outside the flow | Add or fix mapping logic in the backend route so the flow’s text output is wrapped into the expected application response schema. |
 * | No useful answer is produced for a valid question | The connected corpus does not contain relevant legal materials for that topic or jurisdiction | Expand or correct the indexed corpus, confirm source coverage for the target jurisdiction, and test retrieval against known documents. |
 * | Invocation assumptions break when chaining from another system | An upstream caller did not package data into the chat-trigger-compatible `chatMessage` format | Ensure any external orchestrator or sibling system sends a Lamatic-compatible chat payload rather than raw structured fields alone. |
 *
 * ## Notes
 * - The flow source declares no explicit top-level `inputs` schema, so the trigger contract is effectively defined by the `Chat Widget` node and the surrounding application’s message-packaging logic.
 * - The legal answer style is heavily influenced by the referenced system prompt and model configuration files, which are external to the flow source. Changes there can materially alter tone, citation behavior, memory use, retrieval thresholds, and output completeness without changing the flow graph itself.
 * - The `RAG` node has no `vectorDB` value hardcoded in the source, which implies the legal corpus connection must be completed in Lamatic Studio or via associated configuration rather than inferred from this file alone.
 * - This flow is intentionally thin: trigger, retrieve, respond. That simplicity makes it easy to deploy and chain, but it also means guardrails such as disclaimer enforcement, schema shaping, and stricter validation may live in prompts or in the application layer rather than in branching logic inside the flow.
 * - Because the flow is chat-triggered, it is best treated as an interactive research endpoint rather than a batch processor. If you need deterministic structured extraction, post-processing, or multi-step legal workflows, those concerns should be implemented around this flow rather than expected from it directly.
 */

// Flow: legal-rag-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Legal RAG Chatbot",
  "description": "Answer legal research questions against a connected legal corpus and return an informational response with citations, next steps, and a non-advice disclaimer.",
  "tags": [
    "⚖️ Legal",
    "📚 Research",
    "🧑‍💼 Assistant"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/rag-chatbot",
  "author": {
    "name": "jasperan",
    "email": "ignacio.m.martinez@oracle.com"
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
    "legal_rag_chatbot_rag_system": "@prompts/legal-rag-chatbot_rag_system.md"
  },
  "modelConfigs": {
    "legal_rag_chatbot_rag": "@model-configs/legal-rag-chatbot_rag.ts"
  },
  "triggers": {
    "legal_rag_chatbot_chat_widget": "@triggers/widgets/legal-rag-chatbot_chat-widget.ts"
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
        "domains": "@triggers/widgets/legal-rag-chatbot_chat-widget.ts"
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
        "limit": "@model-configs/legal-rag-chatbot_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/legal-rag-chatbot_rag_system.md"
          }
        ],
        "memories": "@model-configs/legal-rag-chatbot_rag.ts",
        "messages": "@model-configs/legal-rag-chatbot_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/legal-rag-chatbot_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/legal-rag-chatbot_rag.ts",
        "generativeModelName": "@model-configs/legal-rag-chatbot_rag.ts"
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

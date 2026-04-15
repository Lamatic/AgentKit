/*
 * # Knowledge Chatbot
 * A chat-widget-based retrieval-augmented generation flow that answers user questions from indexed content and serves as the web assistant entry point in the broader internal knowledge system.
 *
 * ## Purpose
 * This flow is responsible for the end-user question answering part of the kit’s RAG architecture. It accepts a chat message from a web chat widget, converts that message into a retrieval query, searches a configured vector database for relevant knowledge, and uses a generative model to produce a contextual answer grounded in the indexed content. In practical terms, it is the flow that turns an already-built knowledge index into a usable conversational experience.
 *
 * The outcome of the flow is a single chatbot response returned to the chat widget. That matters because the larger bundle separates ingestion from answering: indexation flows gather and vectorise content from enterprise data sources, while assistant flows like this one expose that indexed knowledge to end users. Without this flow, the indexed corpus would exist but would not be accessible through a conversational interface.
 *
 * Within the broader pipeline described by the parent agent, this flow sits after content ingestion and indexing and at the user-facing end of the retrieve-and-synthesize chain. Upstream indexation flows must already have populated the selected vector store with embeddings and metadata. This flow then performs retrieval over that stored knowledge and synthesizes a natural-language answer for the web channel, alongside sibling assistant flows that provide similar behavior for Slack or Microsoft Teams.
 *
 * ## When To Use
 * - Use when a user asks a question through the web chat widget and the answer should come from the organisation’s indexed internal knowledge.
 * - Use when a vector database has already been populated by one or more indexation flows in the same kit.
 * - Use when you want a browser-based assistant experience rather than a Slack or Microsoft Teams assistant.
 * - Use when the task is conversational question answering over existing content, not content ingestion or re-indexing.
 * - Use when the response should be generated from retrieved context using a configured embedding model and text generation model.
 *
 * ## When Not To Use
 * - Do not use before any indexation flow has run; if the vector store is empty or unpopulated, retrieval quality will be poor or no answer can be grounded.
 * - Do not use for ingesting documents, crawling sites, chunking text, or writing embeddings to the vector store; those are handled by the kit’s indexation flows.
 * - Do not use when the interaction channel is Slack or Microsoft Teams and a sibling assistant flow exists for that channel.
 * - Do not use when the input is not a user chat message from the widget trigger.
 * - Do not use when no vector database, embedding model, or generative model has been configured for the `RAG` node.
 * - Do not use when the user needs live public web search rather than answers from the indexed internal corpus.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `chatMessage` | string | Yes | The user’s message submitted through the chat widget trigger. This is the runtime query passed into retrieval as the `queryField`. |
 * | `vectorDB` | select | Yes | Private configuration input on the `RAG` node that selects the vector database to query for relevant content. |
 * | `embeddingModelName` | model (`embedder/text`) | Yes | Private configuration input on the `RAG` node that selects the embedding model used to embed the user query for vector search. |
 * | `generativeModelName` | model (`generator/text`) | Yes | Private configuration input on the `RAG` node that selects the text generation model used to produce the final answer from retrieved context. |
 *
 * The trigger-facing runtime input is the user’s `chatMessage`. The other three inputs are required operator-level configuration values rather than end-user-supplied fields. The flow assumes the incoming message is plain text suitable for semantic retrieval. No explicit max length, language restriction, or schema validation is defined in the flow source, so practical limits depend on the selected widget, vector store, and models.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `content` | string | The final chatbot answer returned to the chat widget, sourced from `RAGNode_711.output.modelResponse`. |
 *
 * The response format is a single prose answer string intended for direct display in the chat widget. The flow does not explicitly attach citations, references, retrieved chunks, confidence metadata, or structured fields in its response node. Completeness and length depend on the retrieved context, prompt design, and the configured generation model.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is an entry-point assistant flow for the web channel, so no upstream flow invokes it directly in the execution graph.
 * - Operationally, however, one or more indexation flows in the parent kit must have run before this flow is useful. Those flows must have produced vectorized knowledge in the configured `vectorDB`, including embeddings and retrieval-ready content chunks.
 * - At runtime, this flow consumes the user message from `triggerNode_1.output.chatMessage` and uses the pre-existing indexed content in the selected vector store.
 *
 * ### Downstream Flows
 * - No separate downstream flow consumes this flow’s output in the provided graph.
 * - The immediate consumer is the web chat widget response path, which uses the `content` field produced by the `Chat Response` node for display to the end user.
 *
 * ### External Services
 * - Chat widget trigger — receives end-user chat messages from the browser widget and delivers responses back to the same channel — credentialing and domain/widget configuration are defined in `@triggers/widgets/knowledge-chatbot_chat-widget.ts`
 * - Vector database — stores and serves the indexed embeddings and source chunks queried by the `RAG` node — required credential depends on the selected `vectorDB`
 * - Embedding model provider — embeds the incoming query for similarity search — required credential depends on the selected `embeddingModelName`
 * - Generative model provider — generates the final natural-language answer from retrieved context and prompts — required credential depends on the selected `generativeModelName`
 * - Lamatic runtime/project configuration — resolves referenced prompts, model config, and constitution during execution — uses workspace/project-level Lamatic configuration
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Credentials and runtime secrets are implicitly required by the selected vector database and model providers, but their exact environment variable names are not specified in this flow definition.
 *
 * ## Node Walkthrough
 * 1. `Chat Widget` (`triggerNode`) starts the flow when a user submits a message through the configured web chat widget. It provides the runtime message as `triggerNode_1.output.chatMessage` and also defines the request-response binding that lets the flow answer back into the same widget session.
 *
 * 2. `RAG` (`dynamicNode`) receives the user’s chat text via its `queryField`, which is mapped from `{{triggerNode_1.output.chatMessage}}`. It queries the configured `vectorDB` using the selected `embeddingModelName`, applies the referenced prompts for system and user behavior, uses the referenced model configuration for retrieval and chat settings such as `limit`, `certainty`, `messages`, and `memories`, and generates a final response as `modelResponse` using the selected `generativeModelName`.
 *
 * 3. `Chat Response` (`dynamicNode`) takes `{{RAGNode_711.output.modelResponse}}` and returns it as the outgoing chat content. This node is connected both to the `RAG` node for content and back to the trigger through the response edge so the generated answer is delivered to the original chat widget caller.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | The flow fails before answering any question | The required private inputs for `vectorDB`, `embeddingModelName`, or `generativeModelName` were not configured | Configure all required `RAG` node inputs in the Lamatic workspace before deployment or testing |
 * | The chatbot returns vague, irrelevant, or hallucinated answers | The vector store is empty, poorly indexed, or populated with low-quality chunks from upstream indexation flows | Run the appropriate indexation flow, verify content was chunked and embedded correctly, and confirm the correct `vectorDB` is selected |
 * | The chatbot responds with no useful knowledge or very limited context | Retrieval returned few or no matching documents due to query mismatch, low corpus coverage, or overly strict retrieval settings in the referenced model config | Confirm the indexed corpus contains relevant material, inspect the `knowledge-chatbot_rag` model config, and test with representative user queries |
 * | Model invocation errors occur at runtime | Credentials for the selected embedding or generative model provider are missing or invalid | Verify provider credentials in the Lamatic environment and ensure the selected models are available to the project |
 * | Vector search errors occur at runtime | Credentials or connectivity for the selected vector database are missing, invalid, or misconfigured | Recheck vector database connection settings and the private database selection bound to `vectorDB` |
 * | The widget receives no response even though the flow appears configured | The chat widget trigger domains or widget settings are misconfigured | Validate the referenced widget trigger configuration in `@triggers/widgets/knowledge-chatbot_chat-widget.ts` and confirm the deployed site is allowed |
 * | User questions are not processed as expected | The incoming payload is not a normal text chat message or the trigger is invoked from the wrong channel | Send plain-text questions through the configured web chat widget and use sibling assistant flows for Slack or Teams |
 * | Answers are based on outdated knowledge | Upstream indexation has not been rerun since source content changed | Re-run the relevant ingestion/indexation flow to refresh the vector store |
 *
 * ## Notes
 * - This flow exposes only the generated answer in its final response. Although retrieval almost certainly uses source chunks internally, the flow does not surface references or citations in the `Chat Response` node.
 * - Retrieval behavior is partly controlled by the referenced `knowledge-chatbot_rag` model config rather than hardcoded directly in the node. Operators should review that config when tuning result count, certainty thresholds, memory, or message behavior.
 * - The flow references both a system prompt and a user prompt, plus the default constitution. Response tone, safety posture, and grounding behavior therefore depend not only on model choice but also on those referenced prompt assets.
 * - The `filters` field on the `RAG` node is empty in this definition, so retrieval is not constrained to a subset of the vector corpus unless such logic is embedded elsewhere in the referenced configuration or database setup.
 * - This is the web-assistant variant of the kit’s RAG interface. In deployments where employees interact through Slack or Microsoft Teams, the corresponding sibling assistant flow should be used instead of adapting this trigger directly.
 */

// Flow: knowledge-chatbot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Knowledge Chatbot",
  "description": "Contextual api to answer queries with knowledge from Content",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "RAGNode_711": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Database",
      "required": true,
      "isPrivate": true,
      "description": "Select the vector database to be queried.",
      "defaultValue": ""
    },
    {
      "mode": "embedding",
      "name": "embeddingModelName",
      "type": "model",
      "label": "Embedding Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "embedder/text",
      "description": "This field allows the user to select the embedding model used to embed the query into vector space. It loads available embedding models through the listModels method.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    },
    {
      "mode": "chat",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model to generate responses from the query results.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "knowledge_chatbot_rag_system": "@prompts/knowledge-chatbot_rag_system.md",
    "knowledge_chatbot_rag_user": "@prompts/knowledge-chatbot_rag_user.md"
  },
  "modelConfigs": {
    "knowledge_chatbot_rag": "@model-configs/knowledge-chatbot_rag.ts"
  },
  "triggers": {
    "knowledge_chatbot_chat_widget": "@triggers/widgets/knowledge-chatbot_chat-widget.ts"
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
        "domains": "@triggers/widgets/knowledge-chatbot_chat-widget.ts",
        "chatConfig": "@triggers/widgets/knowledge-chatbot_chat-widget.ts"
      }
    }
  },
  {
    "id": "RAGNode_711",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "modes": {},
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/knowledge-chatbot_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/knowledge-chatbot_rag_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/knowledge-chatbot_rag_user.md"
          }
        ],
        "memories": "@model-configs/knowledge-chatbot_rag.ts",
        "messages": "@model-configs/knowledge-chatbot_rag.ts",
        "certainty": "@model-configs/knowledge-chatbot_rag.ts",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/knowledge-chatbot_rag.ts",
        "generativeModelName": "@model-configs/knowledge-chatbot_rag.ts"
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
        "content": "{{RAGNode_711.output.modelResponse}}",
        "references": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_711",
    "source": "triggerNode_1",
    "target": "RAGNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_711-chatResponseNode_988",
    "source": "RAGNode_711",
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

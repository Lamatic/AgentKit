/*
 * # Slack Assistant
 * A Slack-triggered retrieval-augmented assistant that answers channel commands using content already indexed in the wider Internal Assistant knowledge system.
 *
 * ## Purpose
 * This flow is responsible for turning a Slack slash-style assistant interaction into a grounded answer drawn from an existing vector knowledge base. It listens for an `ask` command in a configured Slack channel, takes the incoming message text as the retrieval query, runs a retrieval-augmented generation step over indexed content, and posts the generated answer back into Slack. Its job is not to ingest or index knowledge; it assumes that relevant documents have already been vectorised by one of the kit’s indexation flows.
 *
 * The outcome is a contextual response suitable for internal team use inside Slack. That matters because it gives employees a low-friction conversational entry point into the organisation’s indexed knowledge without requiring them to switch tools or manually search source systems. The generated answer is informed by retrieved content and shaped by the configured prompt set and model configuration, which helps keep responses aligned with the assistant’s intended behaviour.
 *
 * Within the broader agent architecture, this flow sits on the assistant side of the pipeline after content ingestion and indexing have already happened. In the overall plan-retrieve-synthesize chain described by the parent agent, upstream indexation flows populate the vector store, and this flow performs the retrieve-and-synthesize portion for Slack users. It is an entry-point flow for user interaction, but it depends operationally on the existence of a populated vector database.
 *
 * ## When To Use
 * - Use when employees need to ask questions from within Slack rather than a web chat or Microsoft Teams interface.
 * - Use when the organisation’s knowledge base has already been indexed into a vector database by one of the kit’s indexation flows.
 * - Use when the interaction should begin from a Slack command in a specific configured channel.
 * - Use when the user’s request is best answered from internal indexed content rather than from live web search or transactional system actions.
 * - Use when you want the response posted back into Slack automatically after retrieval and generation complete.
 *
 * ## When Not To Use
 * - Do not use when no vector database has been configured or populated; the flow cannot answer meaningfully without indexed content.
 * - Do not use for content ingestion, crawling, chunking, or embedding creation from source systems; one of the indexation flows handles that work.
 * - Do not use when the conversational surface should be a website widget or Microsoft Teams; the sibling assistant flows are the correct channel-specific entry points.
 * - Do not use when the incoming event is not a Slack command message matching the configured trigger pattern.
 * - Do not use when Slack credentials or channel configuration are unavailable; the trigger and reply steps both require valid Slack access.
 * - Do not use when the request must return a structured API payload to another system instead of posting a human-readable answer into Slack.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | credential selector | Yes | Slack authentication used by the trigger node to receive commands from Slack. |
 * | `channelName` | resource locator (`list` or `id`) | Yes | Slack channel monitored by the trigger node for the `ask` command. |
 * | `vectorDB` | select | Yes | Vector database queried by the RAG step for relevant knowledge chunks. |
 * | `embeddingModelName` | model (`embedder/text`) | Yes | Embedding model used to convert the incoming Slack query into vector space for retrieval. |
 * | `generativeModelName` | model (`generator/text`) | Yes | Text generation model used to compose the final answer from retrieved context. |
 * | `credentials` | credential selector | Yes | Slack authentication used by the posting node to send the answer message back to Slack. |
 * | `channelName` | resource locator (`list`, `id`, or `name`) | Yes | Slack channel where the generated response is posted. |
 *
 * The trigger receives its actual user query from Slack event data rather than from a manually supplied API field. Specifically, the RAG node reads `triggerNode_1.output.text` as the query text. The flow assumes that the Slack event includes usable text content after the `ask` command and that the configured trigger and response channels are valid and accessible to the supplied Slack credentials. Because both Slack nodes have independent private inputs, operators should ensure they point to the intended workspace context and channel destination.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `text` | string | The incoming Slack command text captured by the trigger and used as the retrieval query. |
 * | `modelResponse` | string | The generated answer produced by the RAG node from retrieved knowledge and prompts. |
 * | `message` | object | Slack message-post result returned by the Slack posting node after sending the response. |
 *
 * In practice, the user-visible output is a prose Slack reply posted into the configured channel. Internally, the flow’s key semantic output is the RAG node’s `modelResponse`, which is then forwarded as the Slack message text. Completeness depends on the quality and coverage of indexed content, the retrieval settings stored in the referenced model configuration, and any limits applied there.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a user-facing entry-point flow for Slack interactions, so no other runtime flow must invoke it directly before execution.
 * - Operationally, it depends on one or more upstream indexation flows from the kit having already populated the selected `vectorDB` with chunked and embedded content.
 * - Those indexation flows must have produced retrievable vectors and associated source text in the shared vector store; this flow consumes that indexed knowledge indirectly through the `vectorDB` selected on `RAGNode_233`.
 * - In broader bundle terms, the relevant upstream flow can be any supported ingestion/indexation flow, such as crawling, document source sync, database ingestion, or storage ingestion, so long as it writes into the same knowledge index this assistant queries.
 *
 * ### Downstream Flows
 * - No downstream Lamatic flow is defined in this flow graph.
 * - The terminal action is a Slack post operation, so the effective consumer is the Slack channel audience rather than another orchestrated flow.
 * - If an external orchestration system wraps this flow, the most useful internal output to consume is `RAGNode_233.output.modelResponse`, but no built-in downstream dependency is declared here.
 *
 * ### External Services
 * - Slack API — receives the trigger command and posts the final response message — required Slack credentials on `triggerNode_1` and `slackNode_156`
 * - Vector database — stores and serves the indexed knowledge used for retrieval — required `vectorDB` selection on `RAGNode_233`
 * - Embedding model provider — converts the Slack query into an embedding for similarity search — required `embeddingModelName` on `RAGNode_233`
 * - Generative model provider — synthesizes the final natural-language answer from retrieved context — required `generativeModelName` on `RAGNode_233`
 * - Prompt resources — define the system and user instruction templates for the RAG step — referenced by `RAGNode_233`
 * - Model configuration resource — supplies retrieval and generation settings such as limits, memories, messages, and certainty — referenced by `RAGNode_233`
 *
 * ### Environment Variables
 * - No environment variables are explicitly declared in the flow source.
 * - Any provider-specific secrets required by the selected model backends or vector database may be managed by Lamatic connection configuration rather than exposed as named environment variables in this flow.
 *
 * ## Node Walkthrough
 * 1. `Slack Trigger` (`triggerNode`) starts the flow when a Slack command matching `ask` is received in the configured channel. It uses the provided Slack credentials to subscribe to the Slack event, immediately returns a lightweight `typing...` acknowledgement to the user, and exposes the incoming message text as `triggerNode_1.output.text` for downstream processing.
 *
 * 2. `RAG` (`dynamicNode` using `RAGNode`) takes the Slack message text from `{{triggerNode_1.output.text}}` and treats it as the retrieval query. It queries the selected `vectorDB`, embeds the query with the configured `embeddingModelName`, retrieves relevant context according to settings stored in `@model-configs/slack-assistant_rag.ts`, and then uses the configured generative model plus the referenced system and user prompts to produce `RAGNode_233.output.modelResponse`.
 *
 * 3. `Slack` (`dynamicNode` using `slackNode`) posts the generated answer back to Slack using the configured response credentials and destination channel. Its message body is set directly from `{{RAGNode_233.output.modelResponse}}`, so whatever the RAG node returns becomes the visible reply in Slack.
 *
 * 4. `addNode` (`addNode`) is a terminal placeholder with no functional business logic in the documented execution path. It does not transform the response and can be treated as the end of the flow graph.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Slack command does not trigger the flow | Invalid Slack credentials, wrong channel selected, or the command is not `ask` | Reconnect Slack credentials, verify the monitored channel, and confirm users are invoking the configured command name. |
 * | User sees `typing...` but no final answer appears | The RAG step failed, the posting node lacks valid credentials/channel access, or the model call timed out | Check execution logs for `RAGNode_233` and `slackNode_156`, verify model access and Slack posting permissions, then retry. |
 * | Response is empty or unhelpful | The vector database is empty, misconfigured, or lacks relevant indexed content | Run the appropriate indexation flow first, confirm documents were embedded into the same `vectorDB`, and test retrieval against known content. |
 * | Retrieval fails before generation | `vectorDB`, `embeddingModelName`, or `generativeModelName` was not configured | Populate all required private inputs on `RAGNode_233` and validate that the selected providers are available in the workspace. |
 * | Slack reply posts to the wrong place | Trigger and response channel settings differ unintentionally, or the posting node was configured to a different channel | Review both Slack node `channelName` settings and align them with the intended interaction channel. |
 * | The assistant ignores the user’s actual question | Incoming Slack event text is malformed, empty, or not passed as expected to `triggerNode_1.output.text` | Inspect the trigger payload, verify the command invocation format in Slack, and confirm the trigger is receiving text content after the command. |
 * | Answers are outdated or incomplete | Upstream indexation flow has not run recently or did not ingest the relevant source | Re-run the appropriate ingestion/indexation flow and confirm the latest content is present in the queried vector store. |
 * | Model-generated answer is too long, too short, or inconsistent | Retrieval and generation behaviour is controlled by the referenced model configuration and prompts | Review `@model-configs/slack-assistant_rag.ts` and the referenced prompt files, then adjust limits, certainty, or instructions as needed. |
 *
 * ## Notes
 * - The flow uses channel-specific Slack integration at both the trigger and response stages, so operators should treat those configurations as part of deployment rather than runtime input.
 * - Prompt behaviour is externalised into `@prompts/slack-assistant_rag_system.md` and `@prompts/slack-assistant_rag_user.md`, which makes this flow easy to tune without changing the graph structure.
 * - Retrieval settings such as result limit, certainty, message handling, and memory behaviour are not hard-coded in the node body; they are delegated to `@model-configs/slack-assistant_rag.ts`.
 * - There is no explicit branching or fallback logic in this flow. If retrieval returns weak context, the quality of the answer depends entirely on the RAG node’s configuration and the completeness of the underlying index.
 * - The final `addNode` is non-operational in terms of business behaviour and can be ignored for most documentation, testing, and orchestration purposes.
 */

// Flow: slack-assistant

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Slack Assistant",
  "description": "Contextual Slack assistant with knowledge from Content",
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
  "RAGNode_233": [
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
  ],
  "slackNode_156": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Slack API authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "channelName",
      "type": "resourceLocator",
      "label": "Channel",
      "modes": [
        {
          "name": "list",
          "type": "select",
          "label": "From List",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "id",
          "type": "text",
          "label": "By ID",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "name",
          "type": "text",
          "label": "By Name",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "description": "Specify the Slack channel by selecting from a list or providing the name.",
      "typeOptions": {
        "loadOptionsMethod": "getChannels"
      },
      "displayOptions": {
        "hide": {},
        "show": {
          "action": [
            "postMessage"
          ]
        }
      },
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    }
  ],
  "triggerNode_1": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Slack API authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "channelName",
      "type": "resourceLocator",
      "label": "Channel",
      "modes": [
        {
          "name": "list",
          "type": "select",
          "label": "From List",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "id",
          "type": "text",
          "label": "By ID",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "description": "Specify the Slack channel by selecting from a list or providing the name.",
      "typeOptions": {
        "loadOptionsMethod": "getChannels"
      },
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
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
    "slack_assistant_rag_system": "@prompts/slack-assistant_rag_system.md",
    "slack_assistant_rag_user": "@prompts/slack-assistant_rag_user.md"
  },
  "modelConfigs": {
    "slack_assistant_rag": "@model-configs/slack-assistant_rag.ts"
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
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Slack Trigger",
        "command": "ask",
        "immediateResponseData": "typing..."
      }
    }
  },
  {
    "id": "RAGNode_233",
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
        "limit": "@model-configs/slack-assistant_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/slack-assistant_rag_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/slack-assistant_rag_user.md"
          }
        ],
        "memories": "@model-configs/slack-assistant_rag.ts",
        "messages": "@model-configs/slack-assistant_rag.ts",
        "certainty": "@model-configs/slack-assistant_rag.ts",
        "queryField": "{{triggerNode_1.output.text}}",
        "embeddingModelName": "@model-configs/slack-assistant_rag.ts",
        "generativeModelName": "@model-configs/slack-assistant_rag.ts"
      }
    }
  },
  {
    "id": "slackNode_156",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "values": {
        "nodeName": "Slack",
        "text": "{{RAGNode_233.output.modelResponse}}",
        "action": "postMessage"
      }
    }
  },
  {
    "id": "plus-node-addNode_983981",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {
        "nodeName": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_233",
    "source": "triggerNode_1",
    "target": "RAGNode_233",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_233-slackNode_156",
    "source": "RAGNode_233",
    "target": "slackNode_156",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "slackNode_156-plus-node-addNode_983981",
    "source": "slackNode_156",
    "target": "plus-node-addNode_983981",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

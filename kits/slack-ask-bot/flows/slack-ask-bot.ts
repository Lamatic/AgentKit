/*
 * # Slack Ask Bot
 * A Slack-triggered retrieval flow that answers `/ask` questions with grounded responses from vectorized knowledge, serving as the entry-point Q&A path in the wider Slack Ask Bot agent.
 *
 * ## Purpose
 * This flow is responsible for handling Slack-native question answering when a user invokes the `/ask` command. It solves the specific problem of delivering fast, consistent answers inside Slack without requiring users to leave their working context or wait for a human responder. The flow accepts the question text from Slack, runs retrieval-augmented generation against indexed knowledge, and posts the generated answer back into Slack.
 *
 * The outcome of this flow is a single grounded response suitable for immediate consumption by the requesting user or channel. That matters because it reduces support friction, shortens response times, and turns a knowledge base into an operational Slack interface rather than a destination users must search manually. In practice, this flow is the mechanism that converts a slash command into a usable answer.
 *
 * Within the broader agent chain, this flow sits at the combined trigger, retrieve, and synthesize stage. It is not a downstream worker invoked by another flow; it is the primary entry-point described by the parent agent. The sequence is straightforward: Slack command intake, retrieval over vectorized data, answer generation by the configured model, and Slack delivery of the final response.
 *
 * ## When To Use
 * - Use when a Slack user invokes the `/ask` slash command and expects an answer inside Slack.
 * - Use when the question should be answered from a pre-indexed, vectorized knowledge base rather than from arbitrary live web search.
 * - Use when you want a grounded response generated from retrieved context, not just a freeform model completion.
 * - Use when your team wants to serve support, product, or operational guidance directly in the `help-product` Slack channel as configured.
 * - Use when the knowledge domain is represented in the connected retrieval layer and the response can be returned as a single message.
 *
 * ## When Not To Use
 * - Do not use if Slack slash command integration has not been configured or the Slack credential is missing.
 * - Do not use if no vectorized knowledge source has been indexed or connected to the RAG configuration.
 * - Do not use for workflows that require multi-step approvals, ticket creation, human escalation logic, or transactional side effects beyond posting a Slack message.
 * - Do not use when the input is not a Slack slash command payload; this flow has no separately declared public input schema.
 * - Do not use when a different flow is intended to answer from live APIs, perform web research, or operate on non-Slack channels.
 * - Do not use when the user expects structured machine-readable output rather than a prose answer message.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `text` | `string` | Yes | The user’s question supplied in the Slack `/ask` command payload and passed into `triggerNode_1.output.text`. |
 * | `user_id` | `string` | No | Slack user identifier conceptually present in the trigger payload; useful for routing or auditing, though not directly referenced by downstream nodes in this flow. |
 * | `user_name` | `string` | No | Slack user name as provided by Slack; not directly consumed by configured nodes. |
 * | `channel_id` | `string` | No | Slack channel identifier from the trigger context; the current flow instead posts to the configured `channelName` value. |
 * | `team_id` | `string` | No | Slack workspace identifier from the slash command payload; not directly consumed by downstream nodes here. |
 * | `enterprise_id` | `string` | No | Slack enterprise identifier if present; not directly consumed by downstream nodes here. |
 * | `response_url` | `string` | No | Slack callback URL conceptually available for command responses depending on connector behavior; not explicitly referenced in the flow definition. |
 *
 * Below the table, the only trigger field directly used by the retrieval pipeline is `text`. The flow assumes the incoming payload is a valid Slack slash command event and that `text` contains a meaningful natural-language question. No explicit max-length guard, language restriction, or schema validation is defined in the flow source, so validation is effectively delegated to Slack and the underlying nodes.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `modelResponse` | `string` | The generated answer from `RAGNode_939`, built from the user query plus retrieved document context. |
 * | `text` | `string` | The Slack message content posted by `slackNode_207`, mapped from `RAGNode_939.output.modelResponse`. |
 * | `postedMessage` | `object` | Connector-level result of the Slack post action, if exposed by the runtime; exact shape is implementation-dependent and not declared in the flow source. |
 *
 * Below the table, the practical output of this flow is a single prose answer delivered back to Slack. Internally, the most important value is `RAGNode_939.output.modelResponse`, which is then used as the outgoing Slack `text`. The response is not a list or strongly typed business object; it is a generated paragraph or short-form answer whose completeness depends on retrieval quality, prompt design, and model limits.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - None. This is a standalone entry-point flow triggered directly by a Slack slash command.
 * - It does not consume outputs from another Lamatic flow before execution begins.
 *
 * ### Downstream Flows
 * - None are defined in the provided agent context.
 * - The flow terminates after posting the generated answer to Slack.
 * - The trailing `addNode_444` is connected after the Slack response node, but no functional downstream processing or declared consumer outputs are configured from it.
 *
 * ### External Services
 * - Slack — receives the `/ask` trigger and posts the final answer message — required credential: `Dylan Slack`
 * - Vector retrieval layer via `RAGNode` — retrieves relevant context from indexed knowledge — required connector or runtime configuration: vector database backing the RAG node
 * - Embedding model — converts the query for similarity search — required model configuration: `@model-configs/slack-ask-bot_rag.ts`
 * - Generative model — synthesizes the grounded answer from query and retrieved context — required model configuration: `@model-configs/slack-ask-bot_rag.ts`
 * - Prompt resource `slack_ask_bot_rag_system` — provides the system instruction for answer generation — referenced from `@prompts/slack-ask-bot_rag_system.md`
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Any required secrets for Slack, the vector store, or model providers are abstracted behind Lamatic credentials and model configuration rather than named directly in this flow.
 *
 * ## Node Walkthrough
 * 1. `Slack /Ask` (`triggerNode`)
 *    - This is the entry point for the flow. It listens for the Slack slash command trigger `ask` and receives the user’s command payload.
 *    - The key value extracted for downstream use is `triggerNode_1.output.text`, which contains the question the user typed after `/ask`.
 *    - The node is also configured with an immediate response message: `Please wait a moment while I answer your question: {{triggerNode_1.output.text}}`. This indicates the Slack integration may acknowledge receipt before the final answer is posted.
 *    - Although the Slack trigger carries broader metadata, this flow only materially forwards the question text into retrieval.
 *
 * 2. `RAG` (`dynamicNode` using `RAGNode`)
 *    - This node receives `{{triggerNode_1.output.text}}` as its `queryField`.
 *    - It performs retrieval-augmented generation using the configured model settings referenced by `@model-configs/slack-ask-bot_rag.ts` for `limit`, `certainty`, `embeddingModelName`, and `generativeModelName`.
 *    - The node applies the system prompt from `@prompts/slack-ask-bot_rag_system.md` and formats the user-side prompt as `User Query: {query} \n Documents: {context}`.
 *    - Retrieval filters are set to an empty array, so no additional metadata restriction is applied by the flow definition.
 *    - Its main output is `RAGNode_939.output.modelResponse`, the final grounded answer generated from the user query and the retrieved document context.
 *
 * 3. `Slack Response` (`dynamicNode` using `slackNode`)
 *    - This node takes `{{RAGNode_939.output.modelResponse}}` and uses it as the outgoing Slack `text`.
 *    - It performs the `postMessage` action using the `Dylan Slack` credential and posts into the configured `channelName` value `help-product`.
 *    - Operationally, this is the delivery step of the flow: the generated answer is sent back into Slack for the audience using the bot.
 *    - The flow definition hardcodes the channel name rather than dynamically routing from the incoming payload, so deployment behavior should be validated against your desired Slack response pattern.
 *
 * 4. `addNode_444` (`addNode`)
 *    - This node is connected after the Slack response node but has no configured `nodeName` or visible processing logic in the flow source.
 *    - In practice, it appears to serve as a placeholder or terminal artifact rather than a meaningful transformation step.
 *    - It does not contribute a documented business output and can generally be treated as non-functional unless extended later.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Slack command does not trigger the flow | Slack slash command setup is incomplete, the trigger keyword is wrong, or the Slack app is not connected to Lamatic | Verify the `/ask` command configuration in Slack, confirm the Lamatic trigger endpoint is registered correctly, and ensure the `Dylan Slack` credential is valid |
 * | Immediate acknowledgement appears but no final answer is posted | The RAG node failed, the model call errored, or the Slack post step could not send the message | Inspect node run logs for `RAGNode_939` and `slackNode_207`, verify model/provider access, and confirm the Slack credential has permission to post to `help-product` |
 * | Response says little or appears unsupported by knowledge | Retrieval returned weak or irrelevant matches due to poor indexing, low-quality embeddings, or missing source documents | Rebuild or improve the vectorized knowledge base, review chunking/indexing strategy, and tune the model config referenced by `@model-configs/slack-ask-bot_rag.ts` |
 * | Answer is empty or unhelpful for short prompts | The incoming `text` field is empty, malformed, or too vague to retrieve useful context | Require users to submit a non-empty question after `/ask`, and add validation or fallback messaging before RAG execution |
 * | Slack post goes to the wrong place | The flow posts to hardcoded `channelName` `help-product` instead of using the incoming command context dynamically | Update the Slack response node to route from trigger metadata if channel-aware reply behavior is required |
 * | Retrieval step fails at runtime | Vector store connectivity or RAG backend configuration is missing even though the flow source references model config files | Confirm the vector database and model provider are configured in the Lamatic environment and available to the `RAG` node |
 * | Authentication or permission errors from Slack | Missing, expired, or insufficient Slack credential scopes | Reconnect `Dylan Slack`, ensure the app has slash command and message posting scopes, and reinstall the app in the target workspace if needed |
 * | Upstream flow not having run | An external orchestrator incorrectly assumes this flow depends on prior Lamatic flow outputs | Treat this flow as an entry-point flow; invoke it directly from Slack rather than waiting on another flow |
 *
 * ## Notes
 * - The flow declares no public `inputs` object in source, so its real input contract is implicit in the Slack trigger payload rather than an explicit API schema.
 * - The `Slack /Ask` trigger contains a `promptTemplate` and the response node also contains a `promptTemplate`, but neither drives the actual answer path here; the operative generation happens inside `RAGNode_939`.
 * - The `vectorDB` field in the RAG node is empty in source, which suggests the actual retrieval backend may be resolved by workspace-level or model-config-level settings. Validate this before production use.
 * - Because `filters` is configured as `[]`, all retrieval scoping depends on the underlying index and similarity settings rather than metadata constraints.
 * - The final response quality is tightly coupled to the hidden contents of `@prompts/slack-ask-bot_rag_system.md` and `@model-configs/slack-ask-bot_rag.ts`, so changes there can materially alter behavior without modifying this flow file.
 * - The presence of `addNode_444` with no configured behavior suggests template residue rather than intentional logic.
 */

// Flow: slack-ask-bot

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Slack Ask Bot",
  "description": "Delivers instant answers through Slack using the /Ask command by running a RAG retrieval on vectorized data. Provides quick answers to audiences already using Slack.",
  "tags": [
    "📞 Support",
    "🚀 Startup",
    "📱 Apps"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/slack-ask-bot",
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
    "slack_ask_bot_rag_system": "@prompts/slack-ask-bot_rag_system.md"
  },
  "modelConfigs": {
    "slack_ask_bot_rag": "@model-configs/slack-ask-bot_rag.ts"
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
        "nodeName": "Slack /Ask",
        "text": "$workflow.QuoteSend.output.generatedResponse",
        "action": "postMessage",
        "command": "ask",
        "trigger": "ask",
        "channelName": "help-product",
        "credentials": "Dylan Slack",
        "promptTemplate": "Generate a motivational quote about $slackNode.text",
        "generativeModelName": {},
        "immediateResponseData": "Please wait a moment while I answer your question: {{triggerNode_1.output.text}}"
      }
    }
  },
  {
    "id": "slackNode_207",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "slackNode",
      "values": {
        "nodeName": "Slack Response",
        "text": "{{RAGNode_939.output.modelResponse}}",
        "action": "postMessage",
        "channelName": "help-product",
        "credentials": "Dylan Slack",
        "promptTemplate": "Generate a motivational quote about $slackNode.text",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "RAGNode_939",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/slack-ask-bot_rag.ts",
        "filters": "[]",
        "prompts": [
          {
            "id": "38ac84dc-81e5-4fff-b524-8ce92660916b",
            "role": "system",
            "content": "@prompts/slack-ask-bot_rag_system.md"
          }
        ],
        "vectorDB": "",
        "certainty": "@model-configs/slack-ask-bot_rag.ts",
        "queryField": "{{triggerNode_1.output.text}}",
        "userTemplate": "User Query: {query} \\n Documents: {context}",
        "embeddingModelName": "@model-configs/slack-ask-bot_rag.ts",
        "generativeModelName": "@model-configs/slack-ask-bot_rag.ts"
      }
    }
  },
  {
    "id": "addNode_444",
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
    "id": "RAGNode_939-slackNode_207",
    "source": "RAGNode_939",
    "target": "slackNode_207",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-RAGNode_939",
    "source": "triggerNode_1",
    "target": "RAGNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "slackNode_207-addNode_444",
    "source": "slackNode_207",
    "target": "addNode_444",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

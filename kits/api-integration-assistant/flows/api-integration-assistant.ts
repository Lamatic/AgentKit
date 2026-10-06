// Flow: api-integration-assistant

// -- Meta --
export const meta = {
  "name": "api-integration-assistant",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "R Sai Dheeraj",
    "email": "16saidheeraj@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "RAGNode_157": [
    {
      "name": "vectorDB",
      "label": "Database",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "api_integration_assistant_ragnode_157_generative_model_name": "@model-configs/api-integration-assistant_ragnode-157_generative-model-name.ts",
    "api_integration_assistant_ragnode_157_embedding_model_name": "@model-configs/api-integration-assistant_ragnode-157_embedding-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "sticky-note-384",
    "type": "stickyNoteNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "stickyNoteNode",
      "values": {
        "text": "# **▶️ Try it out**\n\n---\n\n1. Chat Widget trigger allows you to run a flow whenever a users sends a message.  \n**🎨Customize Chat Widget appearance and behaviour inside the chat widget node**\n2. 🛠️ Configure RAG Node for contextual Response Generation  \n   1. **Setup embedding and AI Model**  \n   2. **Configure System Prompt**  \n   3. **Choose VectorDB**  \n   4. **Pass Query**  \n   5. **Fine Tune results with certainty, references count and filters**  \n   6. ▶️**Test AI Node**\n3. ➕ Map the output to the chat response\n4. Run flow by clicking\n\n# ▶️ **Test 👇🏻**\n\n1. Find Setup instructions to embed this widget on your website\n\n# **〈〉 Setup 👆🏻**",
        "color": "yellow",
        "nodeId": "stickyNoteNode",
        "nodeName": "Sticky Note",
        "nodeType": "stickyNoteNode"
      }
    }
  },
  {
    "id": "sticky-note-601",
    "type": "stickyNoteNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "stickyNoteNode",
      "values": {
        "text": "#  🔁 Built in RAG\n\n---\n\nThe RAG (Retrieval-Augmented Generation) Node is a sophisticated AI component that combines information retrieval with text generation. It first retrieves relevant information from a knowledge base or vector database, then uses that context to generate more accurate and informed responses. This approach returns Contextual LLM response faster than normal setup.\n\nYou can customize LLM context with -\n\n1. Multi-vectorDB - Choose context from many vectorDB running search in parallel\n2. Query - A modified Accurate vector search query for better responses\n3. Custom Filter - Pass metadata filer for search on precise data\n4. Certainty - Select the level of similarity to consider a match\n5. Number of Reference - Choose how many results to be returned.\n\n---\n\n📖 Read the Docs - [RAG Node](https://lamatic.ai/docs/nodes/ai/rag-node)",
        "color": "purple",
        "nodeId": "stickyNoteNode",
        "nodeName": "Sticky Note",
        "nodeType": "stickyNoteNode"
      }
    }
  },
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
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
            "What is lamatic?",
            "How do I add data to my chatbot?",
            "Explain this product to me"
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "userMessageBgColor": "#FEF2F2",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#d12323",
          "agentMessageTextColor": "#334155"
        }
      }
    }
  },
  {
    "id": "RAGNode_157",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "id": "RAGNode_157",
        "limit": 5,
        "prompts": [
          {
            "id": "2a6bb169-5773-473c-8797-409591213626",
            "role": "system",
            "content": "@prompts/api-integration-assistant_ragnode-157_system.md"
          }
        ],
        "nodeName": "RAG",
        "vectorDB": [
          "quickstart"
        ],
        "certainty": "0.64",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/api-integration-assistant_ragnode-157_embedding-model-name.ts",
        "generativeModelName": "@model-configs/api-integration-assistant_ragnode-157_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chatResponseNode",
      "values": {
        "content": "{{RAGNode_157.output.modelResponse}}",
        "nodeName": "Chat Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_157",
    "source": "triggerNode_1",
    "target": "RAGNode_157",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_157-responseNode_triggerNode_1",
    "source": "RAGNode_157",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

// Flow: chat

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Founder Lens - Chat",
  "description": "RAG-powered interactive chat that answers founder questions using the analyzed brief and semantic memory.",
  "tags": [
    "💬 Chat",
    "🧠 RAG",
    "💾 Memory"
  ],
  "testInput": "{\"message\":\"What's the fatal flaw?\",\"userId\":\"test-user-001\",\"sessionId\":\"test-session-001\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/founder-lens/flows/chat",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/founder-lens#chat-flow",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "memoryRetrieveNode_chat": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "RAGNode_brief": [
    {
      "name": "vectorDB",
      "label": "Database",
      "type": "select",
      "isDB": true,
      "required": true,
      "description": "Select the vector database to be queried.",
      "defaultValue": "",
      "isPrivate": true
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "description": "This field allows the user to select the embedding model used to embed the query into vector space. It loads available embedding models through the listModels method.",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "description": "Select the model to generate responses from the query results.",
      "type": "model",
      "mode": "chat",
      "modelType": "generator/text",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "isPrivate": true,
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "LLMNode_chat": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "memoryNode_storeChat": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "description": "Select the model to convert the texts into vector representations.",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
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
    "chat_rag_retrieve_brief_system": "@prompts/chat_rag-retrieve-brief_system.md",
    "chat_founder_lens_chat_system": "@prompts/chat_founder-lens-chat_system.md",
    "chat_founder_lens_chat_user": "@prompts/chat_founder-lens-chat_user.md"
  },
  "scripts": {
    "chat_safe_message": "@scripts/chat_safe-message.ts",
    "chat_context_manager": "@scripts/chat_context-manager.ts",
    "chat_append_warning_if_needed": "@scripts/chat_append-warning-if-needed.ts"
  },
  "modelConfigs": {
    "chat_rag_retrieve_brief": "@model-configs/chat_rag-retrieve-brief.ts",
    "chat_founder_lens_chat": "@model-configs/chat_founder-lens-chat.ts"
  },
  "memory": {
    "chat_memory_retrieve_conversation_history": "@memory/chat_memory-retrieve-conversation-history.ts",
    "chat_memory_add_store_conversation": "@memory/chat_memory-add-store-conversation.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "schema": {
        "sampleOutput": "string"
      },
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"message\": \"string\",\n  \"userId\": \"string\",\n  \"sessionId\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "codeNode_safeMessage",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "safeMessage": "string"
      },
      "values": {
        "id": "codeNode_safeMessage",
        "code": "@scripts/chat_safe-message.ts",
        "nodeName": "Safe Message"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 130
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "memoryRetrieveNode_chat",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "memoryRetrieveNode",
      "schema": {
        "memories": "object",
        "rawMemories": "object"
      },
      "values": {
        "id": "memoryRetrieveNode_chat",
        "limit": "@memory/chat_memory-retrieve-conversation-history.ts",
        "filters": "@memory/chat_memory-retrieve-conversation-history.ts",
        "nodeName": "Memory Retrieve - Conversation History",
        "searchQuery": "@memory/chat_memory-retrieve-conversation-history.ts",
        "memoryCollection": "@memory/chat_memory-retrieve-conversation-history.ts",
        "embeddingModelName": "@memory/chat_memory-retrieve-conversation-history.ts",
        "generativeModelName": "@memory/chat_memory-retrieve-conversation-history.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 260
    },
    "selected": true,
    "draggable": false
  },
  {
    "id": "RAGNode_brief",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "RAGNode",
      "schema": {
        "_meta": "object",
        "references": "string",
        "modelResponse": "string"
      },
      "values": {
        "id": "RAGNode_brief",
        "limit": "@model-configs/chat_rag-retrieve-brief.ts",
        "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"userId\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.userId}}\"\n    },\n    {\n      \"path\": [\n        \"sessionId\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.sessionId}}\"\n    }\n  ]\n}",
        "prompts": [
          {
            "id": "rag-brief-sys-001",
            "role": "system",
            "content": "@prompts/chat_rag-retrieve-brief_system.md"
          }
        ],
        "memories": "@model-configs/chat_rag-retrieve-brief.ts",
        "messages": "@model-configs/chat_rag-retrieve-brief.ts",
        "nodeName": "RAG - Retrieve Brief",
        "vectorDB": "",
        "certainty": "@model-configs/chat_rag-retrieve-brief.ts",
        "queryField": "{{codeNode_safeMessage.output.safeMessage}}",
        "embeddingModelName": "@model-configs/chat_rag-retrieve-brief.ts",
        "generativeModelName": "@model-configs/chat_rag-retrieve-brief.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_contextManager",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "turnCount": "string",
        "briefContext": "string",
        "historyString": "string",
        "isFirstMessage": "string",
        "conversationWarning": "string"
      },
      "values": {
        "id": "codeNode_contextManager",
        "code": "@scripts/chat_context-manager.ts",
        "nodeName": "Context Manager"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 390
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "LLMNode_chat",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "schema": {
        "_meta": "object",
        "images": "array",
        "tool_calls": "object",
        "generatedResponse": "string"
      },
      "values": {
        "id": "LLMNode_chat",
        "tools": [],
        "prompts": [
          {
            "id": "chat-sys-001",
            "role": "system",
            "content": "@prompts/chat_founder-lens-chat_system.md"
          },
          {
            "id": "chat-user-001",
            "role": "user",
            "content": "@prompts/chat_founder-lens-chat_user.md"
          }
        ],
        "memories": "@model-configs/chat_founder-lens-chat.ts",
        "messages": "@model-configs/chat_founder-lens-chat.ts",
        "nodeName": "Founder Lens Chat",
        "generativeModelName": "@model-configs/chat_founder-lens-chat.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 107.5,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_appendWarning",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "finalAnswer": "string"
      },
      "values": {
        "id": "codeNode_appendWarning",
        "code": "@scripts/chat_append-warning-if-needed.ts",
        "nodeName": "Append Warning If Needed"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 650
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "memoryNode_storeChat",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "memoryNode",
      "schema": {
        "memoryActions": "object",
        "extractedFacts": "object"
      },
      "values": {
        "id": "memoryNode_storeChat",
        "nodeName": "Memory Add - Store Conversation",
        "uniqueId": "@memory/chat_memory-add-store-conversation.ts",
        "sessionId": "@memory/chat_memory-add-store-conversation.ts",
        "memoryValue": "@memory/chat_memory-add-store-conversation.ts",
        "memoryCollection": "@memory/chat_memory-add-store-conversation.ts",
        "embeddingModelName": "@memory/chat_memory-add-store-conversation.ts",
        "generativeModelName": "@memory/chat_memory-add-store-conversation.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 780
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "graphqlResponseNode_888",
    "data": {
      "modes": {},
      "nodeId": "graphqlResponseNode",
      "schema": {},
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{codeNode_appendWarning.output.finalAnswer}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 910
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_safeMessage",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_safeMessage",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_safeMessage-RAGNode_brief",
    "type": "defaultEdge",
    "source": "codeNode_safeMessage",
    "target": "RAGNode_brief",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_safeMessage-memoryRetrieveNode_chat",
    "type": "defaultEdge",
    "source": "codeNode_safeMessage",
    "target": "memoryRetrieveNode_chat",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "RAGNode_brief-codeNode_contextManager",
    "type": "defaultEdge",
    "source": "RAGNode_brief",
    "target": "codeNode_contextManager",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "memoryRetrieveNode_chat-codeNode_contextManager",
    "type": "defaultEdge",
    "source": "memoryRetrieveNode_chat",
    "target": "codeNode_contextManager",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_contextManager-LLMNode_chat",
    "type": "defaultEdge",
    "source": "codeNode_contextManager",
    "target": "LLMNode_chat",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_chat-codeNode_appendWarning",
    "type": "defaultEdge",
    "source": "LLMNode_chat",
    "target": "codeNode_appendWarning",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_contextManager-codeNode_appendWarning",
    "type": "defaultEdge",
    "source": "codeNode_contextManager",
    "target": "codeNode_appendWarning",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_appendWarning-memoryNode_storeChat",
    "type": "defaultEdge",
    "source": "codeNode_appendWarning",
    "target": "memoryNode_storeChat",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "memoryNode_storeChat-graphqlResponseNode_888",
    "type": "defaultEdge",
    "source": "memoryNode_storeChat",
    "target": "graphqlResponseNode_888",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-graphqlResponseNode_888",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_888",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

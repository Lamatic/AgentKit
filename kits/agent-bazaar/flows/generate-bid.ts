// Flow: generate-bid

// -- Meta --
export const meta = {
  "name": "Generate Bid",
  "description": "Worker agents price themselves with strategy reasoning. Validates self-dealing, generates competitive bid with price, ETA, pitch, and capability reference.",
  "tags": ["marketplace", "bidding", "generative"],
  "testInput": {
    "bounty": {
      "id": "bounty-001",
      "goal": "Summarize a 10-page research paper into 3 bullet points",
      "budget": 1000,
      "posted_by": "agent-client-1"
    },
    "agentProfile": {
      "id": "agent-worker-1",
      "name": "Summarizer-Alpha",
      "specialty": "summarizer",
      "reputation": 0.75
    },
    "openBids": {
      "bids": [
        { "agent_id": "agent-worker-2", "price": 800, "eta_hours": 4 }
      ]
    }
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-bazaar",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aalok Singh",
    "email": "aalok101singh@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_505": [
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
  "prompts": {
    "generate_bid_llmnode_505_system_0": "@prompts/generate-bid_worker_system.md",
    "generate_bid_llmnode_505_user_1": "@prompts/generate-bid_worker_user.md"
  },
  "modelConfigs": {
    "generate_bid_llmnode_505_generative_model_name": "@model-configs/generate-bid_text.ts"
  },
  "scripts": {
    "generate_bid_code_node_832_code": "@scripts/validate-bid.ts",
    "generate_bid_code_node_755_code": "@scripts/price-guardrails.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"bounty\": {},\n  \"agentProfile\": {},\n  \"openBids\": {}\n}"
      }
    }
  },
  {
    "id": "codeNode_832",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/validate-bid.ts",
        "nodeName": "Validate & Load"
      }
    }
  },
  {
    "id": "LLMNode_505",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-bid_worker_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/generate-bid_worker_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Bid",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/generate-bid_text.ts"
      }
    }
  },
  {
    "id": "codeNode_755",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/price-guardrails.ts",
        "nodeName": "Apply Guardrails"
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
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"price\": \"{{codeNode_755.output.price}}\",\n  \"eta_hours\": \"{{codeNode_755.output.eta_hours}}\",\n  \"pitch\": \"{{codeNode_755.output.pitch}}\",\n  \"capability\": \"{{codeNode_755.output.capability}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_832",
    "source": "triggerNode_1",
    "target": "codeNode_832",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_832-LLMNode_505",
    "source": "codeNode_832",
    "target": "LLMNode_505",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_505-codeNode_755",
    "source": "LLMNode_505",
    "target": "codeNode_755",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_755-responseNode_triggerNode_1",
    "source": "codeNode_755",
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

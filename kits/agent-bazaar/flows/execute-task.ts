// Flow: execute-task

// -- Meta --
export const meta = {
  "name": "Execute Task",
  "description": "Accepts winning bid, locks escrow, executes task, and delivers artifact. Uses reputation-weighted scoring for bid selection.",
  "tags": ["marketplace", "escrow", "execution", "bounty"],
  "testInput": {
    "bounty": {
      "id": "bounty-001",
      "goal": "Summarize a 10-page research paper into 3 bullet points",
      "budget": 1000,
      "posted_by": "agent-client-1",
      "rubric": {
        "criteria": [
          {"name": "Completeness", "weight": 0.4, "description": "Covers all key findings"},
          {"name": "Accuracy", "weight": 0.3, "description": "Factual representation"},
          {"name": "Conciseness", "weight": 0.3, "description": "Within 3 bullet points"}
        ],
        "maxScore": 1.0
      }
    },
    "bids": {
      "bids": [
        {"id": "bid-001", "agent_id": "agent-worker-1", "price": 800, "eta_hours": 4, "pitch": "Expert summarizer", "capability": "capabilities/summarizer.md", "reputation": 0.85, "balance": 5000},
        {"id": "bid-002", "agent_id": "agent-worker-2", "price": 600, "eta_hours": 6, "pitch": "Fast summarizer", "capability": "capabilities/summarizer.md", "reputation": 0.70, "balance": 3000}
      ]
    },
    "capability": "capabilities/summarizer.md"
  },
  "githubUrl": "https://github.com/aalok101singh/AgentKit/tree/main/kits/agent-bazaar",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aalok Singh",
    "email": "aalok101singh@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_344": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_121": [
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
    "execute_task_llmnode_344_system_0": "@prompts/execute-task_accept_system.md",
    "execute_task_llmnode_344_user_1": "@prompts/execute-task_accept_user.md",
    "execute_task_llmnode_121_system_0": "@prompts/execute-task_worker_system.md",
    "execute_task_llmnode_121_user_1": "@prompts/execute-task_worker_user.md"
  },
  "modelConfigs": {
    "execute_task_llmnode_344_generative_model_name": "@model-configs/execute-task_accept_text.ts",
    "execute_task_llmnode_121_generative_model_name": "@model-configs/execute-task_execute_text.ts"
  },
  "scripts": {
    "execute_task_code_node_881_code": "@scripts/execute-task_escrow.ts"
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
        "advance_schema": "{\n  \"bounty\": {},\n  \"bids\": {},\n  \"capability\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_344",
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
            "content": "@prompts/execute-task_accept_system.md"
          },
          {
            "id": "b1ec24a6-15df-46f1-9b70-4ec6f8116596",
            "role": "user",
            "content": "@prompts/execute-task_accept_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Accept Bid",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/execute-task_accept_text.ts"
      }
    }
  },
  {
    "id": "codeNode_881",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/execute-task_escrow.ts",
        "nodeName": "Lock Escrow"
      }
    }
  },
  {
    "id": "LLMNode_121",
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
            "content": "@prompts/execute-task_worker_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/execute-task_worker_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Execute Task",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/execute-task_execute_text.ts"
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
        "outputMapping": "{\n  \"artifact\": \"{{LLMNode_121.output.generatedResponse}}\",\n  \"winnerBidId\": \"{{codeNode_881.output.winnerBidId}}\",\n  \"escrowId\": \"{{codeNode_881.output.escrowId}}\",\n  \"amount\": \"{{codeNode_881.output.amount}}\",\n  \"lockRef\": \"{{codeNode_881.output.lockRef}}\",\n  \"scores\": \"{{codeNode_881.output.scores}}\",\n  \"reason\": \"{{codeNode_881.output.reason}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_344",
    "source": "triggerNode_1",
    "target": "LLMNode_344",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_344-codeNode_881",
    "source": "LLMNode_344",
    "target": "codeNode_881",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_881-LLMNode_121",
    "source": "codeNode_881",
    "target": "LLMNode_121",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_121-responseNode_triggerNode_1",
    "source": "LLMNode_121",
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

// Flow: forge-tradeoff

// -- Meta --
export const meta = {
  "name": "Forge Tradeoff",
  "description": "Analyses both parties' countries and the freelancer's primary concern to provide 3 governing law options with pros, cons, and a recommendation.",
  "tags": ["legal", "cross-border", "recommendations"],
  "testInput": "{\"freelancer_country\":\"Nigeria\",\"client_country\":\"United Kingdom\",\"freelancer_primary_concern\":\"Getting paid on time\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/forge/flows/forge-tradeoff",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_tradeoff": [
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
    "forge_tradeoff_llmnode_tradeoff_system_0": "@prompts/forge-tradeoff_llmnode-tradeoff_system_0.md",
    "forge_tradeoff_llmnode_tradeoff_user_1": "@prompts/forge-tradeoff_llmnode-tradeoff_user_1.md"
  },
  "modelConfigs": {
    "forge_tradeoff_llmnode_tradeoff_generative_model_name": "@model-configs/forge-tradeoff_llmnode-tradeoff_generative-model-name.ts"
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
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"freelancer_name\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"freelancer_payment_method\": \"string\",\n  \"freelancer_primary_concern\": \"string\",\n  \"client_name\": \"string\",\n  \"client_country\": \"string\",\n  \"client_type\": \"string\",\n  \"project_title\": \"string\",\n  \"project_description\": \"string\",\n  \"deliverables\": \"string\",\n  \"timeline_start\": \"string\",\n  \"timeline_end\": \"string\",\n  \"payment_amount\": \"string\",\n  \"payment_currency\": \"string\",\n  \"payment_structure\": \"string\",\n  \"work_type\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_tradeoff",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_tradeoff",
        "tools": [],
        "prompts": [
          {
            "id": "tradeoff-sys-001",
            "role": "system",
            "content": "@prompts/forge-tradeoff_llmnode-tradeoff_system_0.md"
          },
          {
            "id": "tradeoff-user-001",
            "role": "user",
            "content": "@prompts/forge-tradeoff_llmnode-tradeoff_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Governing Law Tradeoff Agent",
        "generativeModelName": "@model-configs/forge-tradeoff_llmnode-tradeoff_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_001",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"options\": \"{{LLMNode_tradeoff.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_tradeoff",
    "source": "triggerNode_1",
    "target": "LLMNode_tradeoff",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_tradeoff-graphqlResponseNode_001",
    "source": "LLMNode_tradeoff",
    "target": "graphqlResponseNode_001",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_001",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_001",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

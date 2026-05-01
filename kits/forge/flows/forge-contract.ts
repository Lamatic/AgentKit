// Flow: forge-contract

// -- Meta --
export const meta = {
  "name": "Forge Contract",
  "description": "Generates a full 13-section services agreement based on project details, confirmed pricing, and chosen governing law.",
  "tags": ["legal", "contract", "generative"],
  "testInput": "{\"project_title\":\"E-commerce Website\",\"freelancer_name\":\"John Doe\",\"client_name\":\"Acme Corp\",\"payment_amount\":\"5000\",\"payment_currency\":\"USD\",\"chosen_governing_law\":\"English Law\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/forge/flows/forge-contract",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_contract": [
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
    "forge_contract_llmnode_contract_system_0": "@prompts/forge-contract_llmnode-contract_system_0.md",
    "forge_contract_llmnode_contract_user_1": "@prompts/forge-contract_llmnode-contract_user_1.md"
  },
  "modelConfigs": {
    "forge_contract_llmnode_contract_generative_model_name": "@model-configs/forge-contract_llmnode-contract_generative-model-name.ts"
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
        "advance_schema": "{\n  \"freelancer_name\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"freelancer_payment_method\": \"string\",\n  \"freelancer_primary_concern\": \"string\",\n  \"client_name\": \"string\",\n  \"client_country\": \"string\",\n  \"client_type\": \"string\",\n  \"project_title\": \"string\",\n  \"project_description\": \"string\",\n  \"deliverables\": \"string\",\n  \"timeline_start\": \"string\",\n  \"timeline_end\": \"string\",\n  \"payment_amount\": \"string\",\n  \"payment_currency\": \"string\",\n  \"payment_structure\": \"string\",\n  \"work_type\": \"string\",\n  \"chosen_governing_law\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_contract",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_contract",
        "tools": [],
        "prompts": [
          {
            "id": "contract-sys-001",
            "role": "system",
            "content": "@prompts/forge-contract_llmnode-contract_system_0.md"
          },
          {
            "id": "contract-user-001",
            "role": "user",
            "content": "@prompts/forge-contract_llmnode-contract_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Contract Generation Agent",
        "generativeModelName": "@model-configs/forge-contract_llmnode-contract_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_002",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"contract\": \"{{LLMNode_contract.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_contract",
    "source": "triggerNode_1",
    "target": "LLMNode_contract",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_contract-graphqlResponseNode_002",
    "source": "LLMNode_contract",
    "target": "graphqlResponseNode_002",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_002",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_002",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

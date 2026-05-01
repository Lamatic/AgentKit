// Flow: forge-pricing

// -- Meta --
export const meta = {
  "name": "Forge Pricing",
  "description": "Analyses the freelancer's field, experience level, country, and deliverables against market data to return AI-calibrated per-item pricing with market context.",
  "tags": ["agentic", "pricing", "Market Analysis"],
  "testInput": "{\"field\":\"Software Engineering\",\"experience_level\":\"Senior\",\"country\":\"Nigeria\",\"deliverables\":\"1. Landing Page\\n2. Auth System\\n3. Database Schema\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agentic/forge/flows/forge-pricing",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Andrew Dosumu",
    "email": "dev@andrewdosumu.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_pricing": [
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
    "forge_pricing_llmnode_pricing_system_0": "@prompts/forge-pricing_llmnode-pricing_system_0.md",
    "forge_pricing_llmnode_pricing_user_1": "@prompts/forge-pricing_llmnode-pricing_user_1.md"
  },
  "modelConfigs": {
    "forge_pricing_llmnode_pricing_generative_model_name": "@model-configs/forge-pricing_llmnode-pricing_generative-model-name.ts"
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
        "advance_schema": "{\n  \"work_type\": \"string\",\n  \"field\": \"string\",\n  \"experience_level\": \"string\",\n  \"years_of_experience\": \"string\",\n  \"deliverables\": \"string\",\n  \"payment_structure\": \"string\",\n  \"currency\": \"string\",\n  \"freelancer_country\": \"string\",\n  \"client_country\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_pricing",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_pricing",
        "tools": [],
        "prompts": [
          {
            "id": "pricing-sys-001",
            "role": "system",
            "content": "@prompts/forge-pricing_llmnode-pricing_system_0.md"
          },
          {
            "id": "pricing-user-001",
            "role": "user",
            "content": "@prompts/forge-pricing_llmnode-pricing_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Pricing Suggestion Agent",
        "generativeModelName": "@model-configs/forge-pricing_llmnode-pricing_generative-model-name.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_004",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"pricing\": \"{{LLMNode_pricing.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_pricing",
    "source": "triggerNode_1",
    "target": "LLMNode_pricing",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_pricing-graphqlResponseNode_004",
    "source": "LLMNode_pricing",
    "target": "graphqlResponseNode_004",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_004",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_004",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

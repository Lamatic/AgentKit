// Flow: offer-negotiator

// -- Meta --
export const meta = {
  "name": "Offer Negotiator",
  "description": "Assess a job offer and generate a negotiation strategy plus a ready-to-send counter-offer email and call script.",
  "tags": ["career", "agentic", "productivity"],
  "testInput": {
    "role": "Senior Software Engineer",
    "company": "Acme Corp",
    "location": "London, UK",
    "seniority": "Senior",
    "current_base": "£85,000",
    "current_bonus": "10%",
    "current_equity": "none",
    "offered_base": "£95,000",
    "offered_bonus": "10%",
    "offered_equity": "0.02% over 4 years",
    "competing_offers": "One other final-stage interview, no offer yet",
    "priorities": "Higher base, remote flexibility",
    "constraints": "Need to decide within a week"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ahmed Abdur Rahman",
    "email": "asquarer02@yahoo.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_516": [
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
    "offer_negotiator_flow_llmnode_516_system_0": "@prompts/offer-negotiator-flow_llmnode-516_system_0.md",
    "offer_negotiator_flow_llmnode_516_user_1": "@prompts/offer-negotiator-flow_llmnode-516_user_1.md"
  },
  "modelConfigs": {
    "offer_negotiator_flow_llmnode_516_generative_model_name": "@model-configs/offer-negotiator-flow_llmnode-516_generative-model-name.ts"
  },
  "scripts": {
    "offer_negotiator_flow_code_node_533_code": "@scripts/offer-negotiator-flow_code-node-533_code.ts"
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
        "advance_schema": "{\n  \"role\": \"string\",\n  \"company\": \"string\",\n  \"location\": \"string\",\n  \"seniority\": \"string\",\n  \"current_base\": \"string\",\n  \"current_bonus\": \"string\",\n  \"current_equity\": \"string\",\n  \"offered_base\": \"string\",\n  \"offered_bonus\": \"string\",\n  \"offered_equity\": \"string\",\n  \"competing_offers\": \"string\",\n  \"priorities\": \"string\",\n  \"constraints\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_516",
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
            "content": "@prompts/offer-negotiator-flow_llmnode-516_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/offer-negotiator-flow_llmnode-516_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/offer-negotiator-flow_llmnode-516_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_533",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/offer-negotiator-flow_code-node-533_code.ts",
        "nodeName": "Code"
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
        "outputMapping": "{\n  \"answer\": \"{{codeNode_533.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_516",
    "source": "triggerNode_1",
    "target": "LLMNode_516",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_516-codeNode_533",
    "source": "LLMNode_516",
    "target": "codeNode_533",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_533-responseNode_triggerNode_1",
    "source": "codeNode_533",
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

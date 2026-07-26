// Flow: flight-booking-agent

// -- Meta --
export const meta = {
  "name": "Flight Booking Agent",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Nhlalonhle",
    "email": "nhlalonkosi@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_977": [
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
    "flight_booking_agent_llmnode_977_system_0": "@prompts/flight-booking-agent_llmnode-977_system_0.md",
    "flight_booking_agent_llmnode_977_user_1": "@prompts/flight-booking-agent_llmnode-977_user_1.md"
  },
  "modelConfigs": {
    "flight_booking_agent_llmnode_977_generative_model_name": "@model-configs/flight-booking-agent_llmnode-977_generative-model-name.ts"
  },
  "scripts": {
    "flight_booking_agent_code_node_383_code": "@scripts/flight-booking-agent_code-node-383_code.ts",
    "flight_booking_agent_code_node_974_code": "@scripts/flight-booking-agent_code-node-974_code.ts"
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
        "advance_schema": "{\n  \"message\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_977",
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
            "content": "@prompts/flight-booking-agent_llmnode-977_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/flight-booking-agent_llmnode-977_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flight-booking-agent_llmnode-977_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_383",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/flight-booking-agent_code-node-383_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "codeNode_974",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/flight-booking-agent_code-node-974_code.ts",
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
        "outputMapping": "{\n  \"status\": \"{{codeNode_974.output.status}}\",\n  \"message\": \"{{codeNode_974.output.message}}\",\n  \"totalAvailable\": \"{{codeNode_974.output.totalAvailable}}\",\n  \"showing\": \"{{codeNode_974.output.showing}}\",\n  \"cheapestPrice\": \"{{codeNode_974.output.cheapestPrice}}\",\n  \"mostExpensive\": \"{{codeNode_974.output.mostExpensive}}\",\n  \"currency\": \"{{codeNode_974.output.currency}}\",\n  \"searchParams\": \"{{codeNode_974.output.searchParams}}\",\n  \"cabinClass\": \"{{codeNode_974.output.cabinClass}}\",\n  \"flights\": \"{{codeNode_974.output.flights}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_977",
    "source": "triggerNode_1",
    "target": "LLMNode_977",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_977-codeNode_383",
    "source": "LLMNode_977",
    "target": "codeNode_383",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_383-codeNode_974",
    "source": "codeNode_383",
    "target": "codeNode_974",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_974-responseNode_triggerNode_1-443",
    "source": "codeNode_974",
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

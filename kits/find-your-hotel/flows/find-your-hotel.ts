// Flow: find-your-hotel

// -- Meta --
export const meta = {
  "name": "Find-your-hotel",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Rohit",
    "email": "nixenboi@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_hotels": [
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
    "find_your_hotel_instructor_llmnode_hotels_system_0": "@prompts/find-your-hotel_instructor-llmnode-hotels_system_0.md",
    "find_your_hotel_instructor_llmnode_hotels_user_1": "@prompts/find-your-hotel_instructor-llmnode-hotels_user_1.md"
  },
  "modelConfigs": {
    "find_your_hotel_instructor_llmnode_hotels_generative_model_name": "@model-configs/find-your-hotel_instructor-llmnode-hotels_generative-model-name.ts"
  },
  "scripts": {
    "find_your_hotel_code_node_prep_code": "@scripts/find-your-hotel_code-node-prep_code.ts",
    "find_your_hotel_code_node_maps_code": "@scripts/find-your-hotel_code-node-maps_code.ts"
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
        "advance_schema": "{\n  \"city\": \"string\",\n  \"country\": \"string\",\n  \"checkIn\": \"string\",\n  \"checkOut\": \"string\",\n  \"adults\": \"string\",\n  \"rooms\": \"string\",\n  \"currency\": \"string\",\n  \"radius\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_prep",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_prep",
        "code": "@scripts/find-your-hotel_code-node-prep_code.ts",
        "nodeName": "Normalize Search Params"
      }
    }
  },
  {
    "id": "InstructorLLMNode_hotels",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_hotels",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"dataSource\": { \"type\": \"string\" },\n    \"disclaimer\": { \"type\": \"string\" },\n    \"city\": { \"type\": \"string\" },\n    \"country\": { \"type\": \"string\" },\n    \"checkIn\": { \"type\": \"string\" },\n    \"checkOut\": { \"type\": \"string\" },\n    \"adults\": { \"type\": \"number\" },\n    \"rooms\": { \"type\": \"number\" },\n    \"currency\": { \"type\": \"string\" },\n    \"hotels\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": { \"type\": \"string\" },\n          \"areaDescription\": { \"type\": \"string\" },\n          \"approxPricePerNight\": { \"type\": \"number\" },\n          \"priceConfidence\": { \"type\": \"string\" },\n          \"phoneNumber\": { \"type\": \"string\" }\n        },\n        \"required\": [\"name\", \"areaDescription\", \"approxPricePerNight\", \"priceConfidence\", \"phoneNumber\"]\n      }\n    }\n  },\n  \"required\": [\"dataSource\", \"disclaimer\", \"city\", \"country\", \"checkIn\", \"checkOut\", \"hotels\"]\n}\n",
        "prompts": [
          {
            "id": "prompt_1",
            "role": "system",
            "content": "@prompts/find-your-hotel_instructor-llmnode-hotels_system_0.md"
          },
          {
            "id": "prompt_2",
            "role": "user",
            "content": "@prompts/find-your-hotel_instructor-llmnode-hotels_user_1.md"
          }
        ],
        "messages": "[]",
        "nodeName": "Find Hotels",
        "attachments": "",
        "generativeModelName": "@model-configs/find-your-hotel_instructor-llmnode-hotels_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_maps",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_maps",
        "code": "@scripts/find-your-hotel_code-node-maps_code.ts",
        "nodeName": "Add Google Maps Links"
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
        "outputMapping": "{\n  \"dataSource\": \"{{InstructorLLMNode_hotels.output.dataSource}}\",\n  \"disclaimer\": \"{{InstructorLLMNode_hotels.output.disclaimer}}\",\n  \"city\": \"{{InstructorLLMNode_hotels.output.city}}\",\n  \"country\": \"{{InstructorLLMNode_hotels.output.country}}\",\n  \"checkIn\": \"{{InstructorLLMNode_hotels.output.checkIn}}\",\n  \"checkOut\": \"{{InstructorLLMNode_hotels.output.checkOut}}\",\n  \"adults\": \"{{InstructorLLMNode_hotels.output.adults}}\",\n  \"rooms\": \"{{InstructorLLMNode_hotels.output.rooms}}\",\n  \"currency\": \"{{InstructorLLMNode_hotels.output.currency}}\",\n  \"hotels\": \"{{codeNode_maps.output.hotels}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_prep",
    "source": "triggerNode_1",
    "target": "codeNode_prep",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_prep-InstructorLLMNode_hotels",
    "source": "codeNode_prep",
    "target": "InstructorLLMNode_hotels",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_hotels-codeNode_maps",
    "source": "InstructorLLMNode_hotels",
    "target": "codeNode_maps",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_prep-codeNode_maps",
    "source": "codeNode_prep",
    "target": "codeNode_maps",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_hotels-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_hotels",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_maps-responseNode_triggerNode_1",
    "source": "codeNode_maps",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

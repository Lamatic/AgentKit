// Flow: plan-trip

// -- Meta --
export const meta = {
  "name": "plan-trip",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Khushi Sharma",
    "email": "khushisharma.50031@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_988": [
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
    "plan_trip_instructor_llmnode_988_system_0": "@prompts/plan-trip_instructor-llmnode-988_system_0.md",
    "plan_trip_instructor_llmnode_988_user_1": "@prompts/plan-trip_instructor-llmnode-988_user_1.md"
  },
  "modelConfigs": {
    "plan_trip_instructor_llmnode_988_generative_model_name": "@model-configs/plan-trip_instructor-llmnode-988_generative-model-name.ts"
  },
  "scripts": {
    "plan_trip_code_node_804_code": "@scripts/plan-trip_code-node-804_code.ts"
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
        "responseType": "realtime",
        "advance_schema": "{\n  \"city\": \"string\",\n  \"days\": \"int\",\n  \"budget\": \"int\",\n  \"preferences\": \"string\",\n  \"travelDate\": \"string\"\n}"
      }
    }
  },
  {
    "id": "apiNode_522",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_522",
        "url": "https://geocoding-api.open-meteo.com/v1/search?name={{triggerNode_1.output.city}}&count=1",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "2",
        "nodeName": "Geocode",
        "retry_deplay": "2",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_804",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/plan-trip_code-node-804_code.ts",
        "nodeName": "PrepDates,"
      }
    }
  },
  {
    "id": "apiNode_865",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "url": "https://api.open-meteo.com/v1/forecast?latitude={{apiNode_522.output.results.0.latitude}}&longitude={{apiNode_522.output.results.0.longitude}}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&start_date={{codeNode_804.output.startDate}}&end_date={{codeNode_804.output.endDate}}",
        "body": "",
        "method": "GET",
        "headers": "",
        "retries": "0",
        "nodeName": "Weather",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "apiNode_655",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_655",
        "url": "https://api.geoapify.com/v2/places?categories=tourism.sights,tourism.attraction,catering.restaurant,catering.cafe,leisure.park&filter=circle:{{apiNode_522.output.results.0.longitude}},{{apiNode_522.output.results.0.latitude}},3000&limit=15&apiKey={{secrets.project.GEOAPIFY_KEY}}",
        "body": "",
        "method": "GET",
        "headers": "{}",
        "retries": "0",
        "nodeName": "Places",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "InstructorLLMNode_988",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"weather\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"estimatedBudget\": {\n          \"type\": \"number\",\n          \"required\": true\n        },\n        \"totalDays\": {\n          \"type\": \"number\",\n          \"required\": true\n        },\n        \"tripTheme\": {\n          \"type\": \"string\",\n          \"required\": true\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"days\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"day\": {\n            \"type\": \"number\",\n            \"required\": true\n          },\n          \"weather\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"budgetUsed\": {\n            \"type\": \"number\",\n            \"required\": true\n          },\n          \"activities\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"time\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"icon\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"name\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"reason\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                }\n              },\n              \"additionalProperties\": true\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"map\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"lat\": {\n            \"type\": \"number\",\n            \"required\": true\n          },\n          \"lon\": {\n            \"type\": \"number\",\n            \"required\": true\n          },\n          \"icon\": {\n            \"type\": \"string\",\n            \"required\": true\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"budget\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"total\": {\n          \"type\": \"number\",\n          \"required\": true\n        },\n        \"estimated\": {\n          \"type\": \"number\",\n          \"required\": true\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"reasons\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/plan-trip_instructor-llmnode-988_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/plan-trip_instructor-llmnode-988_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/plan-trip_instructor-llmnode-988_generative-model-name.ts"
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
        "outputMapping": "{\n  \"summary\": \"{{InstructorLLMNode_988.output.summary}}\",\n  \"days\": \"{{InstructorLLMNode_988.output.days}}\",\n  \"map\": \"{{InstructorLLMNode_988.output.map}}\",\n  \"budget\": \"{{InstructorLLMNode_988.output.budget}}\",\n  \"reasons\": \"{{InstructorLLMNode_988.output.reasons}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-apiNode_522",
    "source": "triggerNode_1",
    "target": "apiNode_522",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_522-codeNode_804",
    "source": "apiNode_522",
    "target": "codeNode_804",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_804-apiNode_865",
    "source": "codeNode_804",
    "target": "apiNode_865",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_865-apiNode_655",
    "source": "apiNode_865",
    "target": "apiNode_655",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_655-InstructorLLMNode_988",
    "source": "apiNode_655",
    "target": "InstructorLLMNode_988",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_988-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_988",
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

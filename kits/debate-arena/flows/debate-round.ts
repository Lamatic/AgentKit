// Flow: debate-round

// -- Meta --
export const meta = {
  "name": "debate-round",
  "description": "Generates one agent's next statement (opening argument or rebuttal) for a given side in a multi-round debate.",
  "tags": ["generative", "multi-agent", "decision-making"],
  "testInput": {
    "topic": "Should our team use microservices or a monolith?",
    "position": { "label": "Monolith", "stance": "Argue for keeping a single deployable monolith" },
    "opponentPosition": { "label": "Microservices", "stance": "Argue for splitting into microservices" },
    "transcript": [],
    "round": 1,
    "isRebuttal": false
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "HEMANTH AMARTHI",
    "email": "hemanthkumar.amarthi7@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_435": [
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
    "debate_round_instructorllmnode_435_system_0": "@prompts/debate-round_instructorllmnode-435_system_0.md",
    "debate_round_instructorllmnode_435_user_1": "@prompts/debate-round_instructorllmnode-435_user_1.md"
  },
  "modelConfigs": {
    "debate_round_instructorllmnode_435_generative_model_name": "@model-configs/debate-round_instructorllmnode-435_generative-model-name.ts"
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
        "advance_schema": "{\n  \"topic\": \"string\",\n  \"position\": {\n    \"label\": \"string\",\n    \"stance\": \"string\"\n  },\n  \"opponentPosition\": {\n    \"label\": \"string\",\n    \"stance\": \"string\"\n  },\n  \"transcript\": [\n    {\n      \"round\": \"int\",\n      \"side\": \"string\",\n      \"label\": \"string\",\n      \"statement\": \"string\",\n      \"keyPoint\": \"string\"\n    }\n  ],\n  \"round\": \"int\",\n  \"isRebuttal\": \"bool\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_435",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_435",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"statement\": {\n      \"type\": \"string\"\n    },\n    \"keyPoint\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "a8e10c3b-8e9c-4acc-a4dc-5f8f0fab68e0",
            "role": "system",
            "content": "@prompts/debate-round_instructorllmnode-435_system_0.md"
          },
          {
            "id": "faf586a0-49bf-49de-9746-eaf78a05334e",
            "role": "user",
            "content": "@prompts/debate-round_instructorllmnode-435_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/debate-round_instructorllmnode-435_generative-model-name.ts"
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
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"statement\": \"{{InstructorLLMNode_435.output.statement}}\",\n  \"keyPoint\": \"{{InstructorLLMNode_435.output.keyPoint}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_435",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_435",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_435-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_435",
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

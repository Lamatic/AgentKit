// Flow: resume-parser

// -- Meta --
export const meta = {
  "name": "resume-parser",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Harshul Dashora",
    "email": "harshuldashora01@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_139": [
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
    "resume_parser_llmnode_139_system_0": "@prompts/resume-parser_llmnode-139_system_0.md",
    "resume_parser_llmnode_139_user_1": "@prompts/resume-parser_llmnode-139_user_1.md"
  },
  "modelConfigs": {
    "resume_parser_llmnode_139_generative_model_name": "@model-configs/resume-parser_llmnode-139_generative-model-name.ts"
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
        "advance_schema": "{\n  \"resumeText\": \"string\",\n  \"jobDescription\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_139",
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
            "content": "@prompts/resume-parser_llmnode-139_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/resume-parser_llmnode-139_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/resume-parser_llmnode-139_generative-model-name.ts"
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
        "outputMapping": "{\n  \"strengths\": {{LLMNode_139.output.generatedResponse.strengths}},\n  \"gaps\": {{LLMNode_139.output.generatedResponse.gaps}},\n  \"questions\": {{LLMNode_139.output.generatedResponse.questions}}\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_139",
    "source": "triggerNode_1",
    "target": "LLMNode_139",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_139-responseNode_triggerNode_1",
    "source": "LLMNode_139",
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

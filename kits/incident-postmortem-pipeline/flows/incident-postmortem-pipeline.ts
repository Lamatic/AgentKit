// Flow: incident-postmortem-pipeline

// -- Meta --
export const meta = {
  "name": "Incident Postmortem Pipeline",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Garvit Bajaj",
    "email": "garvitbajaj05@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_2": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_4": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_3": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_5": [
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
    "incident_postmortem_pipeline_llmnode_1_system_0": "@prompts/incident-postmortem-pipeline_llmnode-1_system_0.md",
    "incident_postmortem_pipeline_llmnode_1_user_1": "@prompts/incident-postmortem-pipeline_llmnode-1_user_1.md",
    "incident_postmortem_pipeline_llmnode_2_system_0": "@prompts/incident-postmortem-pipeline_llmnode-2_system_0.md",
    "incident_postmortem_pipeline_llmnode_2_user_1": "@prompts/incident-postmortem-pipeline_llmnode-2_user_1.md",
    "incident_postmortem_pipeline_llmnode_4_system_0": "@prompts/incident-postmortem-pipeline_llmnode-4_system_0.md",
    "incident_postmortem_pipeline_llmnode_4_user_1": "@prompts/incident-postmortem-pipeline_llmnode-4_user_1.md",
    "incident_postmortem_pipeline_llmnode_3_system_0": "@prompts/incident-postmortem-pipeline_llmnode-3_system_0.md",
    "incident_postmortem_pipeline_llmnode_3_user_1": "@prompts/incident-postmortem-pipeline_llmnode-3_user_1.md",
    "incident_postmortem_pipeline_llmnode_5_system_0": "@prompts/incident-postmortem-pipeline_llmnode-5_system_0.md",
    "incident_postmortem_pipeline_llmnode_5_user_1": "@prompts/incident-postmortem-pipeline_llmnode-5_user_1.md"
  },
  "modelConfigs": {
    "incident_postmortem_pipeline_llmnode_1_generative_model_name": "@model-configs/incident-postmortem-pipeline_llmnode-1_generative-model-name.ts",
    "incident_postmortem_pipeline_llmnode_2_generative_model_name": "@model-configs/incident-postmortem-pipeline_llmnode-2_generative-model-name.ts",
    "incident_postmortem_pipeline_llmnode_4_generative_model_name": "@model-configs/incident-postmortem-pipeline_llmnode-4_generative-model-name.ts",
    "incident_postmortem_pipeline_llmnode_3_generative_model_name": "@model-configs/incident-postmortem-pipeline_llmnode-3_generative-model-name.ts",
    "incident_postmortem_pipeline_llmnode_5_generative_model_name": "@model-configs/incident-postmortem-pipeline_llmnode-5_generative-model-name.ts"
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
        "advance_schema": "{\n  \"logs\": \"string\",\n  \"serviceName\": \"string\",\n  \"recentDeployTime\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "tools": [],
        "prompts": [
          {
            "id": "4114f5bc-25ee-4504-8f9f-36cf0ef8ec14",
            "role": "system",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-1_system_0.md"
          },
          {
            "id": "8af71393-2dd2-4a4b-a08d-4c7d2643297f",
            "role": "user",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Log Extractor",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/incident-postmortem-pipeline_llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_2",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_2",
        "tools": [],
        "prompts": [
          {
            "id": "eec86247-a870-4947-9d3c-739392746727",
            "role": "system",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-2_system_0.md"
          },
          {
            "id": "44fce08c-224a-4d3c-b6f5-1dd817a48530",
            "role": "user",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-2_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Root Cause Ranker",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/incident-postmortem-pipeline_llmnode-2_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_4",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_4",
        "tools": [],
        "prompts": [
          {
            "id": "8f6f4798-db05-4b0b-a1c5-48c22821d13b",
            "role": "system",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-4_system_0.md"
          },
          {
            "id": "9fb3a879-1180-49af-84d7-2327022309e7",
            "role": "user",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-4_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Stakeholder Summary",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/incident-postmortem-pipeline_llmnode-4_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_3",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_3",
        "tools": [],
        "prompts": [
          {
            "id": "fd8cf4ef-a3f3-4547-9173-5089b4ab0526",
            "role": "system",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-3_system_0.md"
          },
          {
            "id": "590c0198-0479-4463-a1d3-055fa031fcb6",
            "role": "user",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-3_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Mitigation Checklist",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/incident-postmortem-pipeline_llmnode-3_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_5",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_5",
        "tools": [],
        "prompts": [
          {
            "id": "73975b5f-6e4f-4ddb-96bb-dd7c7b234b80",
            "role": "system",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-5_system_0.md"
          },
          {
            "id": "2dcbe089-0a97-4cea-bbac-8ccb68d03551",
            "role": "user",
            "content": "@prompts/incident-postmortem-pipeline_llmnode-5_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Postmortem Assembler",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/incident-postmortem-pipeline_llmnode-5_generative-model-name.ts"
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
        "headers": "{\"content-type\": \"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"postmortem\": \"{{LLMNode_5.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-LLMNode_2",
    "source": "LLMNode_1",
    "target": "LLMNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_2-LLMNode_3",
    "source": "LLMNode_2",
    "target": "LLMNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_2-LLMNode_4",
    "source": "LLMNode_2",
    "target": "LLMNode_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_2-LLMNode_5",
    "source": "LLMNode_2",
    "target": "LLMNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_3-LLMNode_5",
    "source": "LLMNode_3",
    "target": "LLMNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_4-LLMNode_5",
    "source": "LLMNode_4",
    "target": "LLMNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_5-responseNode_triggerNode_1",
    "source": "LLMNode_5",
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

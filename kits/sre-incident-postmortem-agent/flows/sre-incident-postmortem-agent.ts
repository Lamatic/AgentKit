// Flow: sre-incident-postmortem-agent

// -- Meta --
export const meta = {
  "name": "sre-incident-postmortem-agent",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Savan Jadav",
    "email": "savan.p.jadav@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_492": [
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
    "sre_incident_postmortem_agent_llmnode_492_system_0": "@prompts/sre-incident-postmortem-agent_llmnode-492_system_0.md",
    "sre_incident_postmortem_agent_llmnode_492_user_1": "@prompts/sre-incident-postmortem-agent_llmnode-492_user_1.md"
  },
  "modelConfigs": {
    "sre_incident_postmortem_agent_llmnode_492_generative_model_name": "@model-configs/sre-incident-postmortem-agent_llmnode-492_generative-model-name.ts"
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
        "advance_schema": "{\n  \"service_name\": \"string\",\n  \"incident_title\": \"string\",\n  \"alert_details\": \"string\",\n  \"logs_or_symptoms\": \"string\",\n  \"timeline_notes\": \"string\",\n  \"impact_description\": \"string\",\n  \"current_status\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_492",
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
            "content": "@prompts/sre-incident-postmortem-agent_llmnode-492_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/sre-incident-postmortem-agent_llmnode-492_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/sre-incident-postmortem-agent_llmnode-492_generative-model-name.ts"
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
        "outputMapping": "{\n  \"postmortem\": \"{{LLMNode_492.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_492",
    "source": "triggerNode_1",
    "target": "LLMNode_492",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_492-responseNode_triggerNode_1",
    "source": "LLMNode_492",
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

// Flow: personalized-outreach-agent

// -- Meta --
export const meta = {
  "name": "personalized-outreach-agent",
  "description": "Drafts a personalized job-outreach message from a company brief and the candidate's real profile, then fact-checks every claim against that profile and returns a corrected message plus a verification report.",
  "tags": ["outreach", "hiring", "guardrails", "anti-hallucination", "multi-agent"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/personalized-outreach-agent",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ganesh kumar T",
    "email": "ganesh957kumar@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_119": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_613": [
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
    "personalized_outreach_agent_llmnode_119_system_0": "@prompts/personalized-outreach-agent_llmnode-119_system_0.md",
    "personalized_outreach_agent_llmnode_119_user_1": "@prompts/personalized-outreach-agent_llmnode-119_user_1.md",
    "personalized_outreach_agent_llmnode_613_system_0": "@prompts/personalized-outreach-agent_llmnode-613_system_0.md",
    "personalized_outreach_agent_llmnode_613_user_1": "@prompts/personalized-outreach-agent_llmnode-613_user_1.md"
  },
  "modelConfigs": {
    "personalized_outreach_agent_llmnode_119_generative_model_name": "@model-configs/personalized-outreach-agent_llmnode-119_generative-model-name.ts",
    "personalized_outreach_agent_llmnode_613_generative_model_name": "@model-configs/personalized-outreach-agent_llmnode-613_generative-model-name.ts"
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
        "advance_schema": "{\n  \"companyInfo\": \"string\",\n  \"candidateProfile\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_119",
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
            "content": "@prompts/personalized-outreach-agent_llmnode-119_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/personalized-outreach-agent_llmnode-119_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/personalized-outreach-agent_llmnode-119_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_613",
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
            "content": "@prompts/personalized-outreach-agent_llmnode-613_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/personalized-outreach-agent_llmnode-613_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/personalized-outreach-agent_llmnode-613_generative-model-name.ts"
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
        "outputMapping": "{\n  \"Output\": \"{{LLMNode_613.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_119",
    "source": "triggerNode_1",
    "target": "LLMNode_119",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_119-LLMNode_613",
    "source": "LLMNode_119",
    "target": "LLMNode_613",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_613-responseNode_triggerNode_1",
    "source": "LLMNode_613",
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

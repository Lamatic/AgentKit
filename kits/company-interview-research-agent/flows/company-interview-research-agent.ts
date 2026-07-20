// Flow: company-interview-research-agent

// -- Meta --
export const meta = {
  "name": "company-interview-research-agent",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Dhanu Anurshetru",
    "email": "dhanuanur25@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "webSearchNode_224": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "agentClassifierNode_548": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_621": [
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
    "company_interview_research_agent_agent_classifier_node_548_system_0": "@prompts/company-interview-research-agent_agent-classifier-node-548_system_0.md",
    "company_interview_research_agent_agent_classifier_node_548_user_1": "@prompts/company-interview-research-agent_agent-classifier-node-548_user_1.md",
    "company_interview_research_agent_llmnode_621_system_0": "@prompts/company-interview-research-agent_llmnode-621_system_0.md",
    "company_interview_research_agent_llmnode_621_user_1": "@prompts/company-interview-research-agent_llmnode-621_user_1.md"
  },
  "modelConfigs": {
    "company_interview_research_agent_agent_classifier_node_548_generative_model_name": "@model-configs/company-interview-research-agent_agent-classifier-node-548_generative-model-name.ts",
    "company_interview_research_agent_llmnode_621_generative_model_name": "@model-configs/company-interview-research-agent_llmnode-621_generative-model-name.ts"
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
        "advance_schema": "{\n  \"company_name\": \"string\",\n  \"job_title\": \"string\"\n}"
      }
    }
  },
  {
    "id": "webSearchNode_224",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_224",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "interview tips and company culture for {{triggerNode_1.output.company_name}}",
        "country": "us",
        "results": 10,
        "language": "en",
        "location": "",
        "nodeName": "Web Search",
        "dateRange": "",
        "credentials": "Serper Basic Auth"
      }
    }
  },
  {
    "id": "agentClassifierNode_548",
    "type": "agentClassifierNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentClassifierNode",
      "values": {
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/company-interview-research-agent_agent-classifier-node-548_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/company-interview-research-agent_agent-classifier-node-548_user_1.md"
          }
        ],
        "nodeName": "Classifier",
        "classifier": [
          {
            "label": "Classifier 1",
            "value": "agentClassifierNode_548-addNode_319",
            "description": "The role is likely to involve technical or case-based interview questions - e.g., data analysis, engineering, quantitative, or problem-solving heavy roles."
          },
          {
            "label": "Classifier 2",
            "value": "agentClassifierNode_548-addNode_918",
            "description": "The role is likely to involve primarily behavioral or mixed interview questions - e.g., roles more focused on soft skills, communication, or general business fit."
          }
        ],
        "generativeModelName": "@model-configs/company-interview-research-agent_agent-classifier-node-548_generative-model-name.ts"
      }
    }
  },
  {
    "id": "addNode_918",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "addNode_319",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "LLMNode_621",
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
            "content": "@prompts/company-interview-research-agent_llmnode-621_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/company-interview-research-agent_llmnode-621_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/company-interview-research-agent_llmnode-621_generative-model-name.ts"
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
        "outputMapping": "{\n  \"interview_brief\": \"{{LLMNode_621.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-webSearchNode_224",
    "source": "triggerNode_1",
    "target": "webSearchNode_224",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_621-responseNode_triggerNode_1-800",
    "source": "LLMNode_621",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "webSearchNode_224-agentClassifierNode_548",
    "source": "webSearchNode_224",
    "target": "agentClassifierNode_548",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_548-addNode_319",
    "source": "agentClassifierNode_548",
    "target": "addNode_319",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_548-addNode_918",
    "source": "agentClassifierNode_548",
    "target": "addNode_918",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "addNode_319-LLMNode_621",
    "source": "addNode_319",
    "target": "LLMNode_621",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_918-LLMNode_621",
    "source": "addNode_918",
    "target": "LLMNode_621",
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

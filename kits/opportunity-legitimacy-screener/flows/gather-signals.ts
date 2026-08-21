// Flow: gather-signals

// -- Meta --
export const meta = {
  "name": "gather-signals",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Muhammad Hamza Nawaz",
    "email": "muhammadhamzanawaz89@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_390": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "webSearchNode_810": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "gather_signals_llmnode_390_system_0": "@prompts/gather-signals_llmnode-390_system_0.md",
    "gather_signals_llmnode_390_user_1": "@prompts/gather-signals_llmnode-390_user_1.md"
  },
  "modelConfigs": {
    "gather_signals_llmnode_390_generative_model_name": "@model-configs/gather-signals_llmnode-390_generative-model-name.ts"
  },
  "scripts": {
    "gather_signals_code_node_512_code": "@scripts/gather-signals_code-node-512_code.ts",
    "gather_signals_code_node_139_code": "@scripts/gather-signals_code-node-139_code.ts"
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
        "advance_schema": "{\n  \"raw_text\": \"string\",\n  \"source_type\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_390",
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
            "content": "@prompts/gather-signals_llmnode-390_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/gather-signals_llmnode-390_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/gather-signals_llmnode-390_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_512",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/gather-signals_code-node-512_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "webSearchNode_810",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_810",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{codeNode_512.output.company_name}} official website reviews",
        "country": "",
        "results": "5",
        "language": "",
        "location": "",
        "nodeName": "Web Search",
        "dateRange": "",
        "credentials": "Serper - AgentKit"
      }
    }
  },
  {
    "id": "codeNode_139",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/gather-signals_code-node-139_code.ts",
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
        "outputMapping": "{\n  \"company_name\": \"{{codeNode_512.output.company_name}}\",\n  \"claimed_domain\": \"{{codeNode_512.output.claimed_domain}}\",\n  \"sender_email\": \"{{codeNode_512.output.sender_email}}\",\n  \"stated_compensation\": \"{{codeNode_512.output.stated_compensation}}\",\n  \"role_title\": \"{{codeNode_512.output.role_title}}\",\n  \"contact_method\": \"{{codeNode_512.output.contact_method}}\",\n  \"search_results\": \"{{codeNode_139.output.search_results}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_390",
    "source": "triggerNode_1",
    "target": "LLMNode_390",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_390-codeNode_512",
    "source": "LLMNode_390",
    "target": "codeNode_512",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_512-webSearchNode_810",
    "source": "codeNode_512",
    "target": "webSearchNode_810",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "webSearchNode_810-codeNode_139",
    "source": "webSearchNode_810",
    "target": "codeNode_139",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_139-responseNode_triggerNode_1-417",
    "source": "codeNode_139",
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

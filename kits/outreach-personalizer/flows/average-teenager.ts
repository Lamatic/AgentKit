// Flow: average-teenager

// -- Meta --
export const meta = {
  "name": "Average Teenager",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Dhruvil Mistry",
    "email": "dhruvilmistry16@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "firecrawlNode_692": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    },
    {
      "name": "urls",
      "label": "URLs",
      "type": "monacoText"
    }
  ],
  "LLMNode_276": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_996": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_696": [
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
    "average_teenager_llmnode_276_system_0": "@prompts/average-teenager_llmnode-276_system_0.md",
    "average_teenager_llmnode_276_user_1": "@prompts/average-teenager_llmnode-276_user_1.md",
    "average_teenager_llmnode_996_system_0": "@prompts/average-teenager_llmnode-996_system_0.md",
    "average_teenager_llmnode_996_user_1": "@prompts/average-teenager_llmnode-996_user_1.md",
    "average_teenager_llmnode_696_system_0": "@prompts/average-teenager_llmnode-696_system_0.md",
    "average_teenager_llmnode_696_user_1": "@prompts/average-teenager_llmnode-696_user_1.md"
  },
  "modelConfigs": {
    "average_teenager_llmnode_276_generative_model_name": "@model-configs/average-teenager_llmnode-276_generative-model-name.ts",
    "average_teenager_llmnode_996_generative_model_name": "@model-configs/average-teenager_llmnode-996_generative-model-name.ts",
    "average_teenager_llmnode_696_generative_model_name": "@model-configs/average-teenager_llmnode-696_generative-model-name.ts"
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
        "advance_schema": "{\n  \"company_url\": \"string\",\n  \"founder_linkedin_url\": \"string\",\n  \"candidate_context\": \"string\"\n}"
      }
    }
  },
  {
    "id": "firecrawlNode_692",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "firecrawlNode",
      "modes": {
        "webhook": "list"
      },
      "values": {
        "id": "firecrawlNode_692",
        "url": "",
        "mode": "syncBatchScrape",
        "urls": "[\"{{triggerNode_1.output.company_url}}\", \"{{triggerNode_1.output.founder_linkedin_url}}\"]",
        "delay": 0,
        "limit": 10,
        "model": "spark-1-mini",
        "mobile": false,
        "prompt": "",
        "search": "",
        "timeout": 30000,
        "waitFor": 2000,
        "webhook": "",
        "nodeName": "Firecrawl",
        "agentUrls": "",
        "agentJobId": "",
        "crawlDepth": 1,
        "crawlLimit": 10,
        "maxCredits": "",
        "agentSchema": "",
        "credentials": "Fire Crawl API 1",
        "excludePath": [],
        "excludeTags": [],
        "includePath": [],
        "includeTags": [],
        "sitemapOnly": false,
        "crawlSubPages": false,
        "ignoreSitemap": false,
        "webhookEvents": [
          "completed",
          "failed",
          "page",
          "started"
        ],
        "changeTracking": false,
        "webhookHeaders": "",
        "onlyMainContent": true,
        "webhookMetadata": "",
        "includeSubdomains": false,
        "maxDiscoveryDepth": 1,
        "allowBackwardLinks": false,
        "allowExternalLinks": false,
        "skipTlsVerification": false,
        "ignoreQueryParameters": true,
        "strictConstrainToURLs": false
      }
    }
  },
  {
    "id": "LLMNode_276",
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
            "content": "@prompts/average-teenager_llmnode-276_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/average-teenager_llmnode-276_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/average-teenager_llmnode-276_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_996",
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
            "content": "@prompts/average-teenager_llmnode-996_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/average-teenager_llmnode-996_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/average-teenager_llmnode-996_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_696",
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
            "content": "@prompts/average-teenager_llmnode-696_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/average-teenager_llmnode-696_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/average-teenager_llmnode-696_generative-model-name.ts"
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-firecrawlNode_692",
    "source": "triggerNode_1",
    "target": "firecrawlNode_692",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_692-LLMNode_276",
    "source": "firecrawlNode_692",
    "target": "LLMNode_276",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_276-LLMNode_996",
    "source": "LLMNode_276",
    "target": "LLMNode_996",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_996-LLMNode_696",
    "source": "LLMNode_996",
    "target": "LLMNode_696",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_696-responseNode_triggerNode_1",
    "source": "LLMNode_696",
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

// Flow: competitor-pricing-tracker

// -- Meta --
export const meta = {
  "name": "competitor-pricing-tracker",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Krish",
    "email": "krishmungalpara007@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "firecrawlNode_658": [
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
  "LLMNode_158": [
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
    "competitor_pricing_tracker_llmnode_158_system_0": "@prompts/competitor-pricing-tracker_llmnode-158_system_0.md",
    "competitor_pricing_tracker_llmnode_158_user_1": "@prompts/competitor-pricing-tracker_llmnode-158_user_1.md"
  },
  "modelConfigs": {
    "competitor_pricing_tracker_llmnode_158_generative_model_name": "@model-configs/competitor-pricing-tracker_llmnode-158_generative-model-name.ts"
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
        "advance_schema": "{\n  \"competitorName\": \"string\",\n  \"url\": \"string\"\n}"
      }
    }
  },
  {
    "id": "firecrawlNode_658",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "firecrawlNode",
      "modes": {
        "webhook": "url"
      },
      "values": {
        "id": "firecrawlNode_658",
        "url": "{{triggerNode_1.output.url}}",
        "mode": "syncSingleScrape",
        "urls": "{{triggerNode_1.output.url}}",
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
        "credentials": "com-tracker",
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
        "changeTracking": true,
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
    "id": "LLMNode_158",
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
            "content": "@prompts/competitor-pricing-tracker_llmnode-158_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/competitor-pricing-tracker_llmnode-158_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/competitor-pricing-tracker_llmnode-158_generative-model-name.ts"
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
        "outputMapping": "{\n  \"result\": \"{{LLMNode_158.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-firecrawlNode_658",
    "source": "triggerNode_1",
    "target": "firecrawlNode_658",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_658-LLMNode_158",
    "source": "firecrawlNode_658",
    "target": "LLMNode_158",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_158-responseNode_triggerNode_1",
    "source": "LLMNode_158",
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

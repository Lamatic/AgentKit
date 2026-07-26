// Flow: know-thy-person

// -- Meta --
export const meta = {
  "name": "know-thy-person",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ayush Gupta",
    "email": "ayushgupta0610@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "webSearchNode_986": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    }
  ],
  "firecrawlNode_553": [
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
  "InstructorLLMNode_946": [
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
    "know_thy_person_instructor_llmnode_946_system_0": "@prompts/know-thy-person_instructor-llmnode-946_system_0.md",
    "know_thy_person_instructor_llmnode_946_user_1": "@prompts/know-thy-person_instructor-llmnode-946_user_1.md"
  },
  "modelConfigs": {
    "know_thy_person_instructor_llmnode_946_generative_model_name": "@model-configs/know-thy-person_instructor-llmnode-946_generative-model-name.ts"
  },
  "scripts": {
    "know_thy_person_code_node_653_code": "@scripts/know-thy-person_code-node-653_code.ts"
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
        "advance_schema": "{\n  \"name\": \"string\",\n  \"email\": \"string\",\n  \"person_context\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_653",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/know-thy-person_code-node-653_code.ts",
        "nodeName": "Resolve"
      }
    }
  },
  {
    "id": "webSearchNode_986",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "values": {
        "id": "webSearchNode_986",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{codeNode_653.output.name}} {{codeNode_653.output.company}} {{triggerNode_1.output.person_context}}",
        "country": "",
        "results": 10,
        "language": "",
        "location": "",
        "nodeName": "Web Search",
        "dateRange": "",
        "credentials": "Serper Basic Auth"
      }
    }
  },
  {
    "id": "firecrawlNode_553",
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
        "id": "firecrawlNode_553",
        "url": "https://{{codeNode_653.output.domain}}",
        "mode": "sync",
        "urls": "",
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
        "crawlLimit": "6",
        "maxCredits": "",
        "agentSchema": "",
        "credentials": "Firecrawl",
        "excludePath": [],
        "excludeTags": [],
        "includePath": [],
        "includeTags": [],
        "sitemapOnly": false,
        "crawlSubPages": true,
        "ignoreSitemap": false,
        "webhookEvents": [
          "completed",
          "failed",
          "page",
          "started"
        ],
        "changeTracking": false,
        "webhookHeaders": "",
        "onlyMainContent": false,
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
    "id": "InstructorLLMNode_946",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"identity\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"name\": {\n          \"type\": \"string\"\n        },\n        \"role\": {\n          \"type\": \"string\"\n        },\n        \"company\": {\n          \"type\": \"string\"\n        },\n        \"location\": {\n          \"type\": \"string\"\n        },\n        \"sources\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"summary\": {\n      \"type\": \"string\"\n    },\n    \"outside_work\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"note\": {\n            \"type\": \"string\"\n          },\n          \"source_url\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"talking_points\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"point\": {\n            \"type\": \"string\"\n          },\n          \"why_it_works\": {\n            \"type\": \"string\"\n          },\n          \"source_url\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"couldnt_confirm\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"sources\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"confidence\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/know-thy-person_instructor-llmnode-946_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/know-thy-person_instructor-llmnode-946_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Synthesize",
        "attachments": "",
        "generativeModelName": "@model-configs/know-thy-person_instructor-llmnode-946_generative-model-name.ts"
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
        "outputMapping": "{\n  \"identity\": \"{{InstructorLLMNode_946.output.identity}}\",\n  \"summary\": \"{{InstructorLLMNode_946.output.summary}}\",\n  \"talkingPoints\": \"{{InstructorLLMNode_946.output.talking_points}}\",\n  \"outsideWork\": \"{{InstructorLLMNode_946.output.outside_work}}\",\n  \"couldntConfirm\": \"{{InstructorLLMNode_946.output.couldnt_confirm}}\",\n  \"confidence\": \"{{InstructorLLMNode_946.output.confidence}}\",\n  \"sources\": \"{{InstructorLLMNode_946.output.sources}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "InstructorLLMNode_946-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_946",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_553-InstructorLLMNode_946",
    "source": "firecrawlNode_553",
    "target": "InstructorLLMNode_946",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-codeNode_653",
    "source": "triggerNode_1",
    "target": "codeNode_653",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_653-webSearchNode_986",
    "source": "codeNode_653",
    "target": "webSearchNode_986",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "webSearchNode_986-firecrawlNode_553",
    "source": "webSearchNode_986",
    "target": "firecrawlNode_553",
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

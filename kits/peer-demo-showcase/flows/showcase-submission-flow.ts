// Flow: showcase-submission-flow

// -- Meta --
export const meta = {
  "name": "showcase-submission-flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Avadhut",
    "email": "avadhutscasual@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "firecrawlNode_927": [
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
  "InstructorLLMNode_297": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_517": [
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
    "showcase_submission_flow_instructor_llmnode_297_system_0": "@prompts/showcase-submission-flow_instructor-llmnode-297_system_0.md",
    "showcase_submission_flow_instructor_llmnode_517_system_0": "@prompts/showcase-submission-flow_instructor-llmnode-517_system_0.md"
  },
  "modelConfigs": {
    "showcase_submission_flow_instructor_llmnode_297_generative_model_name": "@model-configs/showcase-submission-flow_instructor-llmnode-297_generative-model-name.ts",
    "showcase_submission_flow_instructor_llmnode_517_generative_model_name": "@model-configs/showcase-submission-flow_instructor-llmnode-517_generative-model-name.ts"
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
        "advance_schema": "{\n  \"github_url\": \"string\",\n  \"builder_name\": \"string\",\n  \"contact_email\": \"string\"\n}"
      }
    }
  },
  {
    "id": "firecrawlNode_927",
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
        "id": "firecrawlNode_927",
        "url": "{{triggerNode_1.output.github_url}}",
        "mode": "syncSingleScrape",
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
        "crawlLimit": 10,
        "maxCredits": "",
        "agentSchema": "",
        "credentials": "firecrawl-dev",
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
    "id": "InstructorLLMNode_297",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"project_title\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This will be the project title\"\n    },\n    \"description\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the description\"\n    },\n    \"tech_stack\": {\n      \"type\": \"string\",\n      \"description\": \"Tech used\"\n    },\n    \"category\": {\n      \"type\": \"string\",\n      \"description\": \"Category of project\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/showcase-submission-flow_instructor-llmnode-297_system_0.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/showcase-submission-flow_instructor-llmnode-297_generative-model-name.ts"
      }
    }
  },
  {
    "id": "tablesNode_304",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "data": "{}",
        "limit": "10",
        "query": "SELECT * FROM sponsors",
        "where": "",
        "action": "query",
        "offset": "0",
        "columns": "*",
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "sponsors"
      }
    }
  },
  {
    "id": "InstructorLLMNode_517",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"matched_sponsor\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Sponsors matched\"\n    },\n    \"match_justification\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"reason behind choosing the specific sponsor\"\n    },\n    \"breakout_table\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"just a table\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/showcase-submission-flow_instructor-llmnode-517_system_0.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/showcase-submission-flow_instructor-llmnode-517_generative-model-name.ts"
      }
    }
  },
  {
    "id": "tablesNode_942",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_942",
        "data": "{  \"project_title\": \"{{InstructorLLMNode_297.output.project_title}}\",  \"description\": \"{{InstructorLLMNode_297.output.description}}\",  \"tech_stack\": \"{{InstructorLLMNode_297.output.tech_stack}}\",  \"category\": \"{{InstructorLLMNode_297.output.category}}\",  \"matched_sponsor\": \"{{InstructorLLMNode_517.output.matched_sponsor}}\",  \"match_justification\": \"{{InstructorLLMNode_517.output.match_justification}}\",  \"breakout_table\": \"{{InstructorLLMNode_517.output.breakout_table}}\",  \"builder_name\": \"{{triggerNode_1.output.builder_name}}\",  \"contact_email\": \"{{triggerNode_1.output.contact_email}}\",  \"github_url\": \"{{triggerNode_1.output.github_url}}\"}",
        "limit": "10",
        "query": "",
        "where": "",
        "action": "insert",
        "offset": "0",
        "columns": "*",
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "showcase_submissions"
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
        "outputMapping": "{\n  \"project_title\": \"{{InstructorLLMNode_297.output.project_title}}\",\n  \"category\": \"{{InstructorLLMNode_297.output.category}}\",\n  \"matched_sponsor\": \"{{InstructorLLMNode_517.output.matched_sponsor}}\",\n  \"match_justification\": \"{{InstructorLLMNode_517.output.match_justification}}\",\n  \"breakout_table\": \"{{InstructorLLMNode_517.output.breakout_table}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-firecrawlNode_927",
    "source": "triggerNode_1",
    "target": "firecrawlNode_927",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_927-InstructorLLMNode_297",
    "source": "firecrawlNode_927",
    "target": "InstructorLLMNode_297",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_297-tablesNode_304",
    "source": "InstructorLLMNode_297",
    "target": "tablesNode_304",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "tablesNode_304-InstructorLLMNode_517",
    "source": "tablesNode_304",
    "target": "InstructorLLMNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_517-tablesNode_942",
    "source": "InstructorLLMNode_517",
    "target": "tablesNode_942",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "tablesNode_942-responseNode_triggerNode_1",
    "source": "tablesNode_942",
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
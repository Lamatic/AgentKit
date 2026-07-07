// Flow: job

// -- Meta --
export const meta = {
  "name": "Job",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ansh Singh",
    "email": "sansh3030@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "firecrawlNode_795": [
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
  "InstructorLLMNode_200": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "agentClassifierNode_222": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "notionNode_1": [
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
    "job_instructor_llmnode_200_system_0": "@prompts/job_instructor-llmnode-200_system_0.md",
    "job_instructor_llmnode_200_user_1": "@prompts/job_instructor-llmnode-200_user_1.md",
    "job_agent_classifier_node_222_system_0": "@prompts/job_agent-classifier-node-222_system_0.md",
    "job_agent_classifier_node_222_user_1": "@prompts/job_agent-classifier-node-222_user_1.md"
  },
  "modelConfigs": {
    "job_instructor_llmnode_200_generative_model_name": "@model-configs/job_instructor-llmnode-200_generative-model-name.ts",
    "job_agent_classifier_node_222_generative_model_name": "@model-configs/job_agent-classifier-node-222_generative-model-name.ts"
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
        "nodeName": "",
        "responeType": "realtime",
        "advance_schema": "{\n  \"job_url\": \"string\",\n  \"destination\": \"string\"\n}"
      }
    }
  },
  {
    "id": "firecrawlNode_795",
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
        "id": "firecrawlNode_795",
        "url": "{{triggerNode_1.output.job_url}}",
        "mode": "syncSingleScrape",
        "urls": "",
        "delay": 0,
        "limit": 10,
        "model": "spark-1-mini",
        "mobile": false,
        "prompt": "",
        "search": "",
        "timeout": "60000",
        "waitFor": "8000",
        "webhook": "",
        "nodeName": "Firecrawl",
        "agentUrls": "",
        "agentJobId": "",
        "crawlDepth": 1,
        "crawlLimit": 10,
        "maxCredits": "",
        "agentSchema": "",
        "credentials": "Job",
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
    "id": "InstructorLLMNode_200",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"company\": {\n      \"type\": \"string\"\n    },\n    \"role_title\": {\n      \"type\": \"string\"\n    },\n    \"location\": {\n      \"type\": \"string\"\n    },\n    \"remote_type\": {\n      \"type\": \"string\"\n    },\n    \"tech_stack\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"experience_level\": {\n      \"type\": \"string\"\n    },\n    \"salary_range\": {\n      \"type\": \"string\"\n    },\n    \"application_deadline\": {\n      \"type\": \"string\"\n    },\n    \"source_url\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/job_instructor-llmnode-200_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/job_instructor-llmnode-200_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/job_instructor-llmnode-200_generative-model-name.ts"
      }
    }
  },
  {
    "id": "agentClassifierNode_222",
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
            "content": "@prompts/job_agent-classifier-node-222_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/job_agent-classifier-node-222_user_1.md"
          }
        ],
        "nodeName": "Classifier",
        "classifier": [
          {
            "label": "High",
            "value": "agentClassifierNode_222-notionNode_1-high"
          },
          {
            "label": "Low",
            "value": "agentClassifierNode_222-notionNode_1-low"
          }
        ],
        "generativeModelName": "@model-configs/job_agent-classifier-node-222_generative-model-name.ts"
      }
    }
  },
  {
    "id": "notionNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "notionNode",
      "values": {
        "id": "notionNode_1",
        "title": "JOB",
        "action": "NOTION_CREATE_NOTION_PAGE",
        "pageId": "REPLACE_WITH_YOUR_NOTION_PAGE_ID",
        "parent": "REPLACE_WITH_YOUR_NOTION_PAGE_ID",
        "nodeName": "Save to Notion",
        "operation": "createPage",
        "databaseId": "REPLACE_WITH_YOUR_NOTION_DATABASE_ID",
        "properties": {
          "company": "{{InstructorLLMNode_200.output.company}}",
          "location": "{{InstructorLLMNode_200.output.location}}",
          "priority": "{{agentClassifierNode_222.output.class}}",
          "role_title": "{{InstructorLLMNode_200.output.role_title}}",
          "source_url": "{{InstructorLLMNode_200.output.source_url}}",
          "tech_stack": "{{InstructorLLMNode_200.output.tech_stack}}",
          "remote_type": "{{InstructorLLMNode_200.output.remote_type}}",
          "salary_range": "{{InstructorLLMNode_200.output.salary_range}}",
          "experience_level": "{{InstructorLLMNode_200.output.experience_level}}",
          "application_deadline": "{{InstructorLLMNode_200.output.application_deadline}}"
        },
        "credentials": "Notion OAuth"
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
    "id": "triggerNode_1-firecrawlNode_795",
    "source": "triggerNode_1",
    "target": "firecrawlNode_795",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_795-InstructorLLMNode_200",
    "source": "firecrawlNode_795",
    "target": "InstructorLLMNode_200",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_200-agentClassifierNode_222",
    "source": "InstructorLLMNode_200",
    "target": "agentClassifierNode_222",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_222-notionNode_1-high",
    "source": "agentClassifierNode_222",
    "target": "notionNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_222-notionNode_1-low",
    "source": "agentClassifierNode_222",
    "target": "notionNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },

  {
    "id": "notionNode_1-responseNode_triggerNode_1",
    "source": "notionNode_1",
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

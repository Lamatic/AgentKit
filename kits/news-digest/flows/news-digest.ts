// Flow: news-digest

// -- Meta --
export const meta = {
  "name": "News-digest",
  "description": "Scrapes tech news daily via Firecrawl, ranks and deduplicates stories with an LLM, and emails a formatted digest.",
  "tags": ["news", "digest", "automation", "email", "firecrawl"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/news-digest",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Vedanth Rao T",
    "email": "xilinx36@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "firecrawlNode_969": [
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
  "LLMNode_683": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_414": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "gmailNode_230": [
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
    "news_digest_llmnode_683_system_0": "@prompts/news-digest_llmnode-683_system_0.md",
    "news_digest_llmnode_683_user_1": "@prompts/news-digest_llmnode-683_user_1.md",
    "news_digest_llmnode_414_system_0": "@prompts/news-digest_llmnode-414_system_0.md",
    "news_digest_llmnode_414_user_1": "@prompts/news-digest_llmnode-414_user_1.md"
  },
  "modelConfigs": {
    "news_digest_llmnode_683_generative_model_name": "@model-configs/news-digest_llmnode-683_generative-model-name.ts",
    "news_digest_llmnode_414_generative_model_name": "@model-configs/news-digest_llmnode-414_generative-model-name.ts"
  },
  "scripts": {
    "news_digest_code_node_509_code": "@scripts/news-digest_code-node-509_code.ts"
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
      "nodeId": "cronNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "Cron",
        "cronTimezone": "UTC",
        "cronExpression": "0 8 * * *"
      }
    }
  },
  {
    "id": "variablesNode_218",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "id": "variablesNode_218",
        "mapping": "{\n  \"topic\": {\n    \"type\": \"string\",\n    \"value\": \"AI/ML\"\n  },\n  \"top_n\": {\n    \"type\": \"number\",\n    \"value\": \"10\"\n  }\n}",
        "nodeName": "Variables"
      }
    }
  },
  {
    "id": "firecrawlNode_969",
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
        "id": "firecrawlNode_969",
        "url": "https://techcrunch.com/,https://news.ycombinator.com/,https://www.theverge.com/tech,https://arstechnica.com/,https://www.reuters.com/technology/",
        "mode": "syncBatchScrape",
        "urls": "https://techcrunch.com/,https://news.ycombinator.com/,https://www.theverge.com/tech,https://arstechnica.com/,https://www.reuters.com/technology/",
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
        "credentials": "fire",
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
    "id": "LLMNode_683",
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
            "content": "@prompts/news-digest_llmnode-683_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/news-digest_llmnode-683_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/news-digest_llmnode-683_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_414",
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
            "content": "@prompts/news-digest_llmnode-414_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/news-digest_llmnode-414_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/news-digest_llmnode-414_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_509",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/news-digest_code-node-509_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "gmailNode_230",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "gmailNode",
      "values": {
        "cc": "",
        "id": "gmailNode_230",
        "bcc": "",
        "body": "{{codeNode_509.output.html}}",
        "query": "",
        "action": "GMAIL_SEND_EMAIL",
        "format": "full",
        "is_html": true,
        "subject": "Daily {{variablesNode_218.output.topic}} Digest",
        "to_user": "",
        "nodeName": "Gmail",
        "reply_cc": "",
        "from_user": "",
        "reply_bcc": "",
        "thread_id": "",
        "message_id": "",
        "page_token": "",
        "credentials": "Gmail",
        "max_results": 10,
        "add_label_ids": "",
        "reply_is_html": false,
        "attachment_url": "",
        "attachment_name": "",
        "recipient_email": "tvedanthrao@gmail.com",
        "reply_thread_id": "",
        "remove_label_ids": "",
        "list_threads_query": "",
        "reply_message_body": "",
        "attachment_mimetype": "",
        "list_threads_user_id": "me",
        "reply_attachment_url": "",
        "reply_attachment_name": "",
        "reply_recipient_email": "",
        "reply_extra_recipients": "",
        "fetch_emails_page_token": "",
        "list_threads_page_token": "",
        "list_threads_max_results": 10,
        "reply_attachment_mimetype": ""
      }
    }
  },
  {
    "id": "plus-node-addNode_484358",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  }
];

export const edges = [
  {
    "id": "firecrawlNode_969-LLMNode_683",
    "source": "firecrawlNode_969",
    "target": "LLMNode_683",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_683-LLMNode_414",
    "source": "LLMNode_683",
    "target": "LLMNode_414",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "gmailNode_230-plus-node-addNode_484358-199",
    "source": "gmailNode_230",
    "target": "plus-node-addNode_484358",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-variablesNode_218",
    "source": "triggerNode_1",
    "target": "variablesNode_218",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "variablesNode_218-firecrawlNode_969",
    "source": "variablesNode_218",
    "target": "firecrawlNode_969",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_414-codeNode_509",
    "source": "LLMNode_414",
    "target": "codeNode_509",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_509-gmailNode_230",
    "source": "codeNode_509",
    "target": "gmailNode_230",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

// Flow: localboost-ai
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "LocalBoost AI – Lead Intelligence",
  "description": "AI-powered lead analysis and outreach generation for local businesses using real website data.",
  "tags": "AI, Lead Generation, Sales, Automation, Local Business",
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "firecrawlNode_439": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "description": "Select the credentials for crawler authentication.",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "InstructorLLMNode_168": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "localboost_ai_generate_json_system": "@prompts/localboost-ai_generate-json_system.md",
    "localboost_ai_generate_json_user": "@prompts/localboost-ai_generate-json_user.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"business_name\": \"string\",\n  \"website\": \"string\",\n  \"instagram\": \"string\",\n  \"location\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "firecrawlNode_439",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {
        "webhook": "list"
      },
      "nodeId": "firecrawlNode",
      "values": {
        "id": "firecrawlNode_439",
        "url": "{{triggerNode_1.output.website}}",
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
        "credentials": "Firecrawl",
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
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_168",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_168",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"business_summary\": {\n      \"type\": \"string\"\n    },\n    \"evidence\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"detected_problems\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"growth_opportunities\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"quick_wins\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"offer_angle\": {\n      \"type\": \"string\"\n    },\n    \"personalized_outreach\": {\n      \"type\": \"string\"\n    },\n    \"lead_score\": {\n      \"type\": \"string\"\n    },\n    \"reason_for_score\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/localboost-ai_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/localboost-ai_generate-json_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": [
          {
            "type": "generator/text",
            "params": {},
            "configName": "configA",
            "model_name": "gpt-4o-mini",
            "credentialId": "4afd5974-b7f1-4fc8-bf04-e8841720061b",
            "provider_name": "openai",
            "credential_name": "Lead inte"
          }
        ]
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": true
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"business_summary\": \"{{InstructorLLMNode_168.output.business_summary}}\",\n  \"evidence\": \"{{InstructorLLMNode_168.output.evidence}}\",\n  \"detected_problems\": \"{{InstructorLLMNode_168.output.detected_problems}}\",\n  \"growth_opportunities\": \"{{InstructorLLMNode_168.output.growth_opportunities}}\",\n  \"quick_wins\": \"{{InstructorLLMNode_168.output.quick_wins}}\",\n  \"offer_angle\": \"{{InstructorLLMNode_168.output.offer_angle}}\",\n  \"personalized_outreach\": \"{{InstructorLLMNode_168.output.personalized_outreach}}\",\n  \"lead_score\": \"{{InstructorLLMNode_168.output.lead_score}}\",\n  \"reason_for_score\": \"{{InstructorLLMNode_168.output.reason_for_score}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "InstructorLLMNode_168-responseNode_triggerNode_1-317",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_168",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-firecrawlNode_439",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "firecrawlNode_439",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "firecrawlNode_439-InstructorLLMNode_168",
    "type": "defaultEdge",
    "source": "firecrawlNode_439",
    "target": "InstructorLLMNode_168",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "selected": false,
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

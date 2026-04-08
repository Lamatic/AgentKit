// Flow: blog-seo

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "2. SEO Optimization",
  "description": "Optimizes a blog post draft for SEO using target keywords.",
  "tags": [
    "seo",
    "optimization",
    "content",
    "ai"
  ],
  "testInput": {
    "draft": "This is a sample blog post about AI in content creation...",
    "keywords": "AI, content, automation, blogging"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "inputs": [
    {
      "name": "draft",
      "type": "string",
      "required": true,
      "description": "The blog post draft to optimize"
    },
    {
      "name": "keywords",
      "type": "string",
      "required": true,
      "description": "Target keywords for SEO optimization"
    }
  ],
  "outputs": [
    {
      "name": "generatedResponse",
      "type": "string",
      "description": "The SEO-optimized blog post in Markdown format"
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "blog_seo_seo_optimize_content": "@model-configs/blog-seo_seo-optimize-content.ts"
  },
  "prompts": {
    "blog_seo_seo_optimize_content_user": "@prompts/blog-seo_seo-optimize-content_user.md"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_2",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "LLMNode_seo",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "seo_prompt_1",
            "role": "user",
            "content": "@prompts/blog-seo_seo-optimize-content_user.md"
          }
        ],
        "nodeName": "SEO Optimize Content",
        "generativeModelName": "@model-configs/blog-seo_seo-optimize-content.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_2",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"generatedResponse\": \"{{LLMNode_seo.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 300
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_2-LLMNode_seo",
    "type": "defaultEdge",
    "source": "triggerNode_2",
    "target": "LLMNode_seo",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_seo-responseNode_triggerNode_2",
    "type": "defaultEdge",
    "source": "LLMNode_seo",
    "target": "responseNode_triggerNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_2",
    "type": "responseEdge",
    "source": "triggerNode_2",
    "target": "responseNode_triggerNode_2",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

// Flow: blog-drafting

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Blog Drafting",
  "description": "Generates a professional blog post based on topic, keywords, and instructions.",
  "tags": [
    "blog",
    "content",
    "drafting",
    "ai"
  ],
  "testInput": {
    "topic": "The Future of AI in Content Creation",
    "keywords": "AI, content, automation, blogging",
    "instructions": "Write in a friendly, professional tone. Include an introduction, 3 main points, and a conclusion."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "inputs": [
    {
      "name": "topic",
      "type": "string",
      "required": true,
      "description": "The topic or title for the blog post"
    },
    {
      "name": "keywords",
      "type": "string",
      "required": true,
      "description": "Comma-separated keywords to include in the blog post"
    },
    {
      "name": "instructions",
      "type": "string",
      "required": false,
      "description": "Additional instructions for the AI (tone, length, style, etc.)"
    }
  ],
  "outputs": [
    {
      "name": "generatedResponse",
      "type": "string",
      "description": "The generated blog post draft"
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
    "blog_drafting_generate_blog_draft": "@model-configs/blog-drafting_generate-blog-draft.ts"
  },
  "prompts": {
    "blog_drafting_generate_blog_draft_user": "@prompts/blog-drafting_generate-blog-draft_user.md"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
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
    "id": "LLMNode_drafting",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "draft_prompt_1",
            "role": "user",
            "content": "@prompts/blog-drafting_generate-blog-draft_user.md"
          }
        ],
        "nodeName": "Generate Blog Draft",
        "generativeModelName": "@model-configs/blog-drafting_generate-blog-draft.ts"
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
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"generatedResponse\": \"{{LLMNode_drafting.output}}\"\n}"
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
    "id": "triggerNode_1-LLMNode_drafting",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_drafting",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_drafting-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_drafting",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

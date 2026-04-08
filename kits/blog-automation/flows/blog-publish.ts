// Flow: blog-publish

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3. CMS Publishing",
  "description": "Publishes the optimized blog post to WordPress or another CMS.",
  "tags": [
    "publish",
    "wordpress",
    "cms",
    "api"
  ],
  "testInput": {
    "title": "Test Blog Post Title",
    "content": "This is the test content for the blog post."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "inputs": [
    {
      "name": "title",
      "type": "string",
      "required": true,
      "description": "The title of the blog post"
    },
    {
      "name": "content",
      "type": "string",
      "required": true,
      "description": "The blog post content to publish"
    }
  ],
  "outputs": [
    {
      "name": "url",
      "type": "string",
      "description": "The URL of the published blog post"
    },
    {
      "name": "status",
      "type": "string",
      "description": "The publish status (publish, draft, etc.)"
    },
    {
      "name": "id",
      "type": "number",
      "description": "The ID of the published post"
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "triggers": {
    "blog_publish_api_request": "@triggers/webhooks/blog-publish_api-request.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_3",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "@triggers/webhooks/blog-publish_api-request.ts",
        "advance_schema": "@triggers/webhooks/blog-publish_api-request.ts"
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
    "id": "apiNode_publish",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://public-api.wordpress.com/wp/v2/sites/{{env.WORDPRESS_SITE_ID}}/posts",
        "body": {
          "title": "{{triggerNode_3.output.title}}",
          "content": "{{triggerNode_3.output.content}}",
          "status": "publish"
        },
        "method": "POST",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer {{env.WORDPRESS_TOKEN}}"
        },
        "nodeName": "Publish to WordPress"
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
    "id": "responseNode_triggerNode_3",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"url\": \"{{apiNode_publish.output.link}}\",\n  \"status\": \"{{apiNode_publish.output.status}}\",\n  \"id\": \"{{apiNode_publish.output.id}}\"\n}"
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
    "id": "triggerNode_3-apiNode_publish",
    "type": "defaultEdge",
    "source": "triggerNode_3",
    "target": "apiNode_publish",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_publish-responseNode_triggerNode_3",
    "type": "defaultEdge",
    "source": "apiNode_publish",
    "target": "responseNode_triggerNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_3",
    "type": "responseEdge",
    "source": "triggerNode_3",
    "target": "responseNode_triggerNode_3",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

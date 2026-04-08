// Flow: classifier
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "GitHub Manager",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_400": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
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
      },
      "isPrivate": true
    }
  ],
  "searchNode_852": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "LLMNode_972": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
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
      },
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "classifier_generate_text_system": "@prompts/classifier_generate-text_system.md",
    "classifier_generate_text_user": "@prompts/classifier_generate-text_user.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "webhookTriggerNode",
      "schema": {
        "body": "string",
        "title": "string",
        "issue_number": "number",
        "repo_full_name": "string"
      },
      "values": {
        "nodeName": "Webhook"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": true
  },
  {
    "id": "LLMNode_400",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_400",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/classifier_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": ""
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "conditionNode_731",
    "data": {
      "label": "Condition",
      "modes": {},
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_731-addNode_120",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{RAGNode_463.output.modelResponse}}\",\n      \"operator\": \"ilike\",\n      \"value\": \"DOCS\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_731-addNode_225",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "searchNode_852",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_852",
        "limit": 3,
        "filters": "[]",
        "nodeName": "Vector Search",
        "vectorDB": "",
        "certainty": "0.85",
        "searchQuery": "{{triggerNode_1.output.title}}      {{triggerNode_1.output.body}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "LLMNode_972",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_972",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/classifier_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/classifier_generate-text_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 520
    },
    "selected": false
  },
  {
    "id": "apiNode_451",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_451",
        "url": "https://api.github.com/repos/{{triggerNode_1.output.repo_full_name}}/issues/{{triggerNode_1.output.issue_number}}/labels ",
        "body": "{\"labels\": [\"documentation\"]}",
        "method": "POST",
        "headers": "{\"Accept\":\"application/vnd.github+json\",\"X-GitHub-Api-Version\":\"2022-11-28\",\"User-Agent\":\"Lamatic-App\",\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "apiNode_453",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_453",
        "url": "https://api.github.com/repos/{{triggerNode_1.output.repo_full_name}}/issues/{{triggerNode_1.output.issue_number}}/comments ",
        "body": "{\n  \"body\": \"{{LLMNode_972.output.generatedResponse}}\"\n}",
        "method": "POST",
        "headers": "{\"Accept\":\"application/vnd.github+json\",\"X-GitHub-Api-Version\":\"2022-11-28\",\"User-Agent\":\"Lamatic-App\",\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 780
    },
    "selected": false
  },
  {
    "id": "apiNode_342",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_342",
        "url": "https://api.github.com/repos/{{triggerNode_1.output.repo_full_name}}/issues/{{triggerNode_1.output.issue_number}}/labels ",
        "body": "{\n  \"labels\": [\"bug\"]\n}",
        "method": "POST",
        "headers": "{\"Accept\":\"application/vnd.github+json\",\"X-GitHub-Api-Version\":\"2022-11-28\",\"User-Agent\":\"Lamatic-App\",\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": false
  },
  {
    "id": "plus-node-addNode_517437",
    "data": {
      "label": "+",
      "nodeId": "addNode",
      "values": {}
    },
    "type": "addNode",
    "measured": {
      "width": 216,
      "height": 100
    },
    "position": {
      "x": 225,
      "y": 910
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "conditionNode_731-searchNode_852-953",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_731",
    "target": "searchNode_852",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_852-LLMNode_972",
    "type": "defaultEdge",
    "source": "searchNode_852",
    "target": "LLMNode_972",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_731-apiNode_342-143",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_731",
    "target": "apiNode_342",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_972-apiNode_451",
    "type": "defaultEdge",
    "source": "LLMNode_972",
    "target": "apiNode_451",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_451-apiNode_453",
    "type": "defaultEdge",
    "source": "apiNode_451",
    "target": "apiNode_453",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_400-conditionNode_731",
    "type": "defaultEdge",
    "source": "LLMNode_400",
    "target": "conditionNode_731",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_342-plus-node-addNode_517437-497",
    "type": "defaultEdge",
    "source": "apiNode_342",
    "target": "plus-node-addNode_517437",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_453-plus-node-addNode_517437-147",
    "type": "defaultEdge",
    "source": "apiNode_453",
    "target": "plus-node-addNode_517437",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-LLMNode_400-640",
    "data": {},
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "LLMNode_400",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };

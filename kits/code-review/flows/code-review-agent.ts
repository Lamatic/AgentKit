// Flow: code-review-agent
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Code Review Agent",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_312": [
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
  ],
  "InstructorLLMNode_549": [
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
  ],
  "InstructorLLMNode_538": [
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
  ],
  "InstructorLLMNode_481": [
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
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "bug_analysis_system": "@prompts/bug-analysis-system.md",
    "security_scan_system": "@prompts/security-scan-system.md",
    "style_check_system": "@prompts/style-check-system.md",
    "final_merge_system": "@prompts/final-merge-system.md"
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
        "repo": "string",
        "owner": "string",
        "pr_number": "string"
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
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "apiNode_688",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_688",
        "url": "https://api.github.com/repos/{{triggerNode_1.output.owner}}/{{triggerNode_1.output.repo}}/pulls/{{triggerNode_1.output.pr_number}}/files",
        "body": "",
        "method": "GET",
        "headers": "{\"Accept\":\"application/vnd.github.v3+json\",\"User-Agent\":\"code-review-agent\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_delay": "0",
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
      "y": 130
    },
    "selected": false
  },
  {
    "id": "codeNode_104",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "diff": "string"
      },
      "values": {
        "id": "codeNode_104",
        "code": "const files = {{apiNode_688.output}};\nlet diff = \"\";\nfor (const file of files) {\n  diff += `File: ${file.filename}\\n${file.patch || \"\"}\\n\\n`;\n}\noutput = { diff: diff };",
        "nodeName": "Code"
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
    "selected": false
  },
  {
    "id": "InstructorLLMNode_312",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_312",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"bugs\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"line\": {\n            \"type\": \"string\"\n          },\n          \"issue\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/bug-analysis-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "Analyze this PR diff for bugs and logic errors. Reference specific line numbers and code from the diff.\n{{codeNode_104.output.diff}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Bug_Analysis",
        "attachments": "",
        "generativeModelName": "llama-3.3-70b-versatile"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_549",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_549",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"security\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"line\": {\n            \"type\": \"string\"\n          },\n          \"issue\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/security-scan-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "Analyze this PR diff for security vulnerabilities. Reference specific line numbers and code from the diff.\n{{codeNode_104.output.diff}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Security_Scan",
        "attachments": "",
        "generativeModelName": "llama-3.3-70b-versatile"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_538",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_538",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"style\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/style-check-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "Analyze this PR diff for code style and readability issues. Reference specific line numbers and code from the diff. {{codeNode_104.output.diff}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Style_Check",
        "attachments": "",
        "generativeModelName": "llama-3.3-70b-versatile"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": true
  },
  {
    "id": "plus-node-addNode_846235",
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
      "x": 0,
      "y": 910
    }
  },
  {
    "id": "InstructorLLMNode_481",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_481",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/final-merge-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "BUGS: {{InstructorLLMNode_312.output.bugs}}\nSECURITY: {{InstructorLLMNode_549.output.security}}\nSTYLE: {{InstructorLLMNode_538.output.style}}\nBased on these three code review analyses, write a concise 2-3 sentence overall summary of the PR quality"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Final_Merge",
        "attachments": "",
        "generativeModelName": "llama-3.3-70b-versatile"
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
  }
];

export const edges = [
  {
    "id": "InstructorLLMNode_312-InstructorLLMNode_549-380",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_312",
    "target": "InstructorLLMNode_549",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_549-InstructorLLMNode_538-415",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_549",
    "target": "InstructorLLMNode_538",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-apiNode_688-888",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "apiNode_688",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_688-codeNode_104-909",
    "type": "defaultEdge",
    "source": "apiNode_688",
    "target": "codeNode_104",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_104-InstructorLLMNode_312-743",
    "type": "defaultEdge",
    "source": "codeNode_104",
    "target": "InstructorLLMNode_312",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_538-InstructorLLMNode_481-685",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_538",
    "target": "InstructorLLMNode_481",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_481-plus-node-addNode_846235-985",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_481",
    "target": "plus-node-addNode_846235",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };

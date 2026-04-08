// Flow: agentic-reasoning-search-web
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning - Search Web",
  "description": "This flow searches the internet as part of Agentic Reasoning",
  "tags": [],
  "testInput": {
    "steps": "I’ll start by searching the latest weather forecast for Jaipur next week and reviewing reliable travel and cultural resources to understand seasonal needs and local norms. I’ll also look up any events, safety advisories, and airline baggage rules to tailor packing to your itinerary and constraints. Then I’ll synthesize everything and prepare a structured packing list with essentials, optional items, and smart tips for comfort and safety. Since this is a new request, I’ll treat it as new."
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "webSearchNode_441": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Serper authentication.",
      "defaultValue": "",
      "isCredential": true
    }
  ],
  "InstructorLLMNode_445": [
    {
      "mode": "instructor",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model to generate text based on the prompt.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
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
    "generate_json_system": "@prompts/generate-json-system.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
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
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"steps\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_445",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate JSON",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"queries\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"required\": true\n      },\n      \"description\": \"This is the collection of queries based on which the research will be prepared\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "STEPS : {{triggerNode_1.output.steps}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": ""
      }
    }
  },
  {
    "id": "forLoopNode_626",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "modes": {},
      "values": {
        "nodeName": "Loop",
        "wait": 0,
        "endValue": "10",
        "increment": "1",
        "connectedTo": "forLoopEndNode_366",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{InstructorLLMNode_445.output.queries}}"
      }
    }
  },
  {
    "id": "forLoopEndNode_366",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "modes": {},
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_626"
      }
    }
  },
  {
    "id": "webSearchNode_441",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "webSearchNode",
      "modes": {},
      "values": {
        "nodeName": "Web Search",
        "page": 1,
        "type": "https://google.serper.dev/search",
        "query": "{{forLoopNode_626.output.currentValue}}",
        "country": "",
        "results": "5",
        "language": "",
        "location": "",
        "dateRange": ""
      }
    }
  },
  {
    "id": "codeNode_201",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Collate Research",
        "code": "const researchArray = {{forLoopEndNode_366.output.loopOutput}};\n\nconst research = researchArray.flatMap((searchEntry) => {\n  return searchEntry.webSearchNode_441.output.output.organic;\n});\n\nconst links = research.map((item) => item.link);\n\noutput = {\n  research: research,\n  links: links\n};"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "retries": "0",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"research\": \"{{codeNode_201.output.research}}\",\n  \"links\": \"{{codeNode_201.output.links}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_445",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_445",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_445-forLoopNode_626",
    "source": "InstructorLLMNode_445",
    "target": "forLoopNode_626",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_626-webSearchNode_441",
    "source": "forLoopNode_626",
    "target": "webSearchNode_441",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    }
  },
  {
    "id": "forLoopNode_626-forLoopEndNode_366",
    "source": "forLoopNode_626",
    "target": "forLoopEndNode_366",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": false
    }
  },
  {
    "id": "webSearchNode_441-forLoopEndNode_366",
    "source": "webSearchNode_441",
    "target": "forLoopEndNode_366",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_366-forLoopNode_626",
    "source": "forLoopEndNode_366",
    "target": "forLoopNode_626",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": true
    }
  },
  {
    "id": "forLoopEndNode_366-codeNode_201",
    "source": "forLoopEndNode_366",
    "target": "codeNode_201",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_201-responseNode_triggerNode_1",
    "source": "codeNode_201",
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

// Flow: hiring-agent
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Hiring Agent",
  "description": "This template allows you to analyse an input resume and gives detailed analysis of selection/rejection",
  "tags": [
    "🌱 Growth"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/hiring-agent",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "hiring_agent_supervisor_user": "@prompts/hiring-agent_supervisor_user.md",
    "hiring_agent_supervisor_system": "@prompts/hiring-agent_supervisor_system.md",
    "hiring_agent_github_username_finder_user": "@prompts/hiring-agent_github-username-finder_user.md",
    "hiring_agent_github_username_finder_system": "@prompts/hiring-agent_github-username-finder_system.md",
    "hiring_agent_github_projects_analyser_user": "@prompts/hiring-agent_github-projects-analyser_user.md",
    "hiring_agent_github_projects_analyser_system": "@prompts/hiring-agent_github-projects-analyser_system.md",
    "hiring_agent_resume_projects_analyser_user": "@prompts/hiring-agent_resume-projects-analyser_user.md",
    "hiring_agent_resume_projects_analyser_system": "@prompts/hiring-agent_resume-projects-analyser_system.md",
    "hiring_agent_insight_evaluator_user": "@prompts/hiring-agent_insight-evaluator_user.md",
    "hiring_agent_insight_evaluator_system": "@prompts/hiring-agent_insight-evaluator_system.md"
  },
  "scripts": {
    "hiring_agent_code": "@scripts/hiring-agent_code.ts"
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
        "headers": "",
        "retries": "0",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": "{\n  \"resume_url\": \"string\",\n  \"job_description\": \"string\"\n}"
      }
    }
  },
  {
    "id": "agentNode_852",
    "type": "agentNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentNode",
      "values": {
        "nodeName": "Supervisor",
        "tools": [],
        "agents": [
          {
            "name": "Parser",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"resume_url\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the resume url, from which the contents and links can be extracted\"\n    },\n    \"job_description\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the job description for which the applicant has applied with the current resume\"\n    }\n  }\n}",
            "description": "This path has to parse through the resume of the applicant and see for necessary skills and projects on their Github"
          },
          {
            "name": "Evaluator",
            "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"project_insights\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This implies the project insights based on the resume of the user\"\n    },\n    \"job_description\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This is the job description for which the applicant has applied with the current resume\"\n    }\n  }\n}",
            "description": "This path would give a score based on the insights found from the projects and give reasoning for the same"
          }
        ],
        "prompts": [
          {
            "id": "7a2cf6d8-1d6d-4e69-a71c-0a4111ad4814",
            "role": "user",
            "content": "@prompts/hiring-agent_supervisor_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_supervisor_system.md"
          }
        ],
        "messages": "[]",
        "stopWord": "",
        "connectedTo": "agentLoopEndNode_558",
        "maxIterations": 5,
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "agentLoopEndNode_558",
    "type": "agentLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentLoopEndNode",
      "modes": {},
      "values": {
        "nodeName": "Agent Loop End",
        "connectedTo": "agentNode_852"
      }
    }
  },
  {
    "id": "extractFromFileNode_920",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "modes": {},
      "values": {
        "nodeName": "Extract from File",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{agentNode_852.output.resume_url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    }
  },
  {
    "id": "LLMNode_728",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Github Username Finder",
        "tools": [],
        "prompts": [
          {
            "id": "68482e18-8ce4-41d4-94b9-f24508922db1",
            "role": "user",
            "content": "@prompts/hiring-agent_github-username-finder_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_github-username-finder_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "conditionNode_160",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "modes": [],
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_727-addNode_373",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{LLMNode_571.output.generatedResponse}}\",\n      \"operator\": \"!=\",\n      \"value\": \"Github ID Not Found\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_727-addNode_369",
            "condition": {}
          }
        ]
      }
    }
  },
  {
    "id": "LLMNode_741",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Github Projects Analyser",
        "tools": [
          "2ee8a92d-e6d4-442c-9334-61bdf0e7d311"
        ],
        "prompts": [
          {
            "id": "6c9c3e7c-bb64-4047-9cac-3089ff468d62",
            "role": "user",
            "content": "@prompts/hiring-agent_github-projects-analyser_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_github-projects-analyser_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "codeNode_629",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Code",
        "code": "@scripts/hiring-agent_code.ts"
      }
    }
  },
  {
    "id": "LLMNode_867",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Resume Projects Analyser",
        "tools": [],
        "prompts": [
          {
            "id": "de7faf55-c2f6-43dd-bb31-f6c35e7399ae",
            "role": "user",
            "content": "@prompts/hiring-agent_resume-projects-analyser_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_resume-projects-analyser_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "InstructorLLMNode_593",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Insight Evaluator",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"score\": {\n      \"type\": \"number\",\n      \"required\": true,\n      \"description\": \"This defines the score of how ideal the candidate is to take further for the given job description\"\n    },\n    \"reasoning\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"This defines the reasoning and logic for the score given to this candidate\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "9cf0d810-74c5-4b9c-aa00-96d706180916",
            "role": "user",
            "content": "@prompts/hiring-agent_insight-evaluator_user.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hiring-agent_insight-evaluator_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "graphqlResponseNode_677",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{agentLoopEndNode_558.output.finalResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-agentNode_852",
    "source": "triggerNode_1",
    "target": "agentNode_852",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentNode_852-extractFromFileNode_920",
    "source": "agentNode_852",
    "target": "extractFromFileNode_920",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Parser",
      "invisible": false
    }
  },
  {
    "id": "agentNode_852-InstructorLLMNode_593",
    "source": "agentNode_852",
    "target": "InstructorLLMNode_593",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Evaluator",
      "invisible": false
    }
  },
  {
    "id": "agentNode_852-agentLoopEndNode_558",
    "source": "agentNode_852",
    "target": "agentLoopEndNode_558",
    "type": "agentLoopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Agent Loop End",
      "invisible": true
    }
  },
  {
    "id": "codeNode_629-agentLoopEndNode_558",
    "source": "codeNode_629",
    "target": "agentLoopEndNode_558",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_593-agentLoopEndNode_558",
    "source": "InstructorLLMNode_593",
    "target": "agentLoopEndNode_558",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "agentLoopEndNode_558-agentNode_852",
    "source": "agentLoopEndNode_558",
    "target": "agentNode_852",
    "type": "agentLoopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Agent Loop End",
      "invisible": false
    }
  },
  {
    "id": "extractFromFileNode_920-LLMNode_728",
    "source": "extractFromFileNode_920",
    "target": "LLMNode_728",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_728-conditionNode_160",
    "source": "LLMNode_728",
    "target": "conditionNode_160",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_727-addNode_373",
    "source": "conditionNode_160",
    "target": "LLMNode_741",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_727-addNode_369",
    "source": "conditionNode_160",
    "target": "LLMNode_867",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge"
  },
  {
    "id": "LLMNode_741-codeNode_629",
    "source": "LLMNode_741",
    "target": "codeNode_629",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_867-codeNode_629",
    "source": "LLMNode_867",
    "target": "codeNode_629",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentLoopEndNode_558-graphqlResponseNode_677",
    "source": "agentLoopEndNode_558",
    "target": "graphqlResponseNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_677",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_677",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

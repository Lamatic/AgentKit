// Flow: first-flow

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "first_flow",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_277": [
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
  "InstructorLLMNode_582": [
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
  "InstructorLLMNode_264": [
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
  "LLMNode_982": [
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
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "first_flow_jd_analyzer_agent_user": "@prompts/first-flow_jd-analyzer-agent_user.md",
    "first_flow_matching_agent_user": "@prompts/first-flow_matching-agent_user.md",
    "first_flow_scoring_agent_user": "@prompts/first-flow_scoring-agent_user.md",
    "first_flow_reasoning_agent_user": "@prompts/first-flow_reasoning-agent_user.md"
  },
  "modelConfigs": {
    "first_flow_jd_analyzer_agent": "@model-configs/first-flow_jd-analyzer-agent.ts",
    "first_flow_matching_agent": "@model-configs/first-flow_matching-agent.ts",
    "first_flow_scoring_agent": "@model-configs/first-flow_scoring-agent.ts",
    "first_flow_reasoning_agent": "@model-configs/first-flow_reasoning-agent.ts"
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
        "id": "triggerNode_1",
        "nodeName": "Initial Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"job_description\": \"string\",\n  \"name\": \"string\",\n  \"certificates\": \"[string]\",\n  \"education\": \"string\",\n  \"experience_years\": \"int\",\n  \"projects\": \"[string]\",\n  \"skills\": \"[string]\"\n}"
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
    "id": "InstructorLLMNode_277",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_277",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"role\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"skills_required\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"experience_level\": {\n      \"type\": \"number\"\n    },\n    \"tools\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"nice_to_have\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_jd-analyzer-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_jd-analyzer-agent.ts",
        "messages": "@model-configs/first-flow_jd-analyzer-agent.ts",
        "nodeName": "JD Analyzer Agent",
        "attachments": "@model-configs/first-flow_jd-analyzer-agent.ts",
        "generativeModelName": "@model-configs/first-flow_jd-analyzer-agent.ts"
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
    "selected": true
  },
  {
    "id": "InstructorLLMNode_582",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_582",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"skill_match\": {\n      \"type\": \"number\",\n      \"description\": \"0-100\"\n    },\n    \"experience_match\": {\n      \"type\": \"number\",\n      \"description\": \"0-100\"\n    },\n    \"project_relevance\": {\n      \"type\": \"number\",\n      \"description\": \"0-100\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_matching-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_matching-agent.ts",
        "messages": "@model-configs/first-flow_matching-agent.ts",
        "nodeName": "Matching Agent",
        "attachments": "@model-configs/first-flow_matching-agent.ts",
        "generativeModelName": "@model-configs/first-flow_matching-agent.ts"
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
    "id": "InstructorLLMNode_264",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_264",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"final_score\": {\n      \"type\": \"number\"\n    },\n    \"verdict\": {\n      \"type\": \"string\"\n    },\n    \"breakdown\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"skill_match\": {\n          \"type\": \"number\"\n        },\n        \"experience_match\": {\n          \"type\": \"number\"\n        },\n        \"project_relevance\": {\n          \"type\": \"number\"\n        }\n      },\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_scoring-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_scoring-agent.ts",
        "messages": "@model-configs/first-flow_scoring-agent.ts",
        "nodeName": "Scoring Agent",
        "attachments": "@model-configs/first-flow_scoring-agent.ts",
        "generativeModelName": "@model-configs/first-flow_scoring-agent.ts"
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
    "id": "LLMNode_982",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_982",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/first-flow_reasoning-agent_user.md"
          }
        ],
        "memories": "@model-configs/first-flow_reasoning-agent.ts",
        "messages": "@model-configs/first-flow_reasoning-agent.ts",
        "nodeName": "Reasoning Agent",
        "attachments": "@model-configs/first-flow_reasoning-agent.ts",
        "credentials": "@model-configs/first-flow_reasoning-agent.ts",
        "generativeModelName": "@model-configs/first-flow_reasoning-agent.ts"
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
        "outputMapping": "{\n  \"candidate\": {\n    \"name\": \"{{triggerNode_1.output.name}}\",\n    \"skills\": \"{{triggerNode_1.output.skills}}\",\n    \"experience\": \"{{triggerNode_1.output.experience_years}}\"\n  },\n  \"evaluation\": {\n    \"final_score\": \"{{InstructorLLMNode_264.output.final_score}}\",\n    \"verdict\": \"{{InstructorLLMNode_264.output.verdict}}\",\n    \"breakdown\": {\n      \"skill_match\": \"{{InstructorLLMNode_582.output.skill_match}}\",\n      \"experience_match\": \"{{InstructorLLMNode_582.output.experience_match}}\",\n      \"project_relevance\": \"{{InstructorLLMNode_582.output.project_relevance}}\"\n    }\n  },\n  \"reasoning\": \"{{LLMNode_982.output.generatedResponse}}\"\n}"
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
      "y": 650
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_277",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_277",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_582-InstructorLLMNode_264",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_582",
    "target": "InstructorLLMNode_264",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_264-LLMNode_982",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_264",
    "target": "LLMNode_982",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_982-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_982",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_277-InstructorLLMNode_582-455",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_277",
    "target": "InstructorLLMNode_582",
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

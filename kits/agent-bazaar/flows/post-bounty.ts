// Flow: post-bounty

// -- Meta --
export const meta = {
  "name": "Post Bounty",
  "description": "Validates bounty scope and budget, then generates a 3-5 criterion acceptance rubric using LLM. First flow in the Agent Bazaar economy pipeline.",
  "tags": ["generative", "marketplace", "bounty"],
  "testInput": {
    "goal": "Summarize a 10-page research paper into 3 bullet points",
    "budget": 1000
  },
  "githubUrl": "https://github.com/aalok101singh/AgentKit/tree/main/kits/agent-bazaar",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aalok Singh",
    "email": "aalok101singh@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_823": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "post_bounty_instructor_llmnode_823_system_0": "@prompts/post-bounty_rubric_system.md",
    "post_bounty_instructor_llmnode_823_user_1": "@prompts/post-bounty_rubric_user.md"
  },
  "modelConfigs": {
    "post_bounty_instructor_llmnode_823_generative_model_name": "@model-configs/post-bounty_text.ts"
  },
  "scripts": {
    "post_bounty_code_node_901_code": "@scripts/validate-bounty.ts"
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"goal\": \"string\",\n  \"budget\": \"int\"\n}"
      }
    }
  },
  {
    "id": "codeNode_901",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/validate-bounty.ts",
        "nodeName": "Validate Bounty"
      }
    }
  },
  {
    "id": "InstructorLLMNode_823",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"criteria\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"weight\": {\n            \"type\": \"number\"\n          },\n          \"description\": {\n            \"type\": \"string\"\n          },\n          \"passCondition\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"maxScore\": {\n      \"type\": \"number\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/post-bounty_rubric_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/post-bounty_rubric_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Rubric",
        "attachments": "",
        "generativeModelName": "@model-configs/post-bounty_text.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"goal\": \"{{codeNode_901.output.goal}}\",\n  \"budget\": \"{{codeNode_901.output.budget}}\",\n  \"rubric\": \"{{InstructorLLMNode_823.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_901",
    "source": "triggerNode_1",
    "target": "codeNode_901",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_901-InstructorLLMNode_823",
    "source": "codeNode_901",
    "target": "InstructorLLMNode_823",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_823-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_823",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

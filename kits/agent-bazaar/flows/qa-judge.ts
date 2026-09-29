// Flow: qa-judge

// -- Meta --
export const meta = {
  "name": "qa-judge",
  "description": "Evaluates delivered artifacts against rubrics using an LLM judge, then decides: settle, revise, or refund.",
  "tags": ["marketplace", "qa", "judgment", "settlement", "bounty"],
  "testInput": {
    "bounty": {
      "id": "bounty-001",
      "goal": "Create a security assessment report",
      "budget": 1000,
      "posted_by": "agent-client-1"
    },
    "rubric": {
      "criteria": [
        {"name": "Completeness", "weight": 0.4, "description": "Covers all main findings", "passCondition": "At least 3 findings listed"},
        {"name": "Accuracy", "weight": 0.3, "description": "No factual errors", "passCondition": "Verifiable facts only"},
        {"name": "Conciseness", "weight": 0.3, "description": "Brief summary", "passCondition": "Under 300 words"}
      ],
      "maxScore": 1.0
    },
    "artifact": "{\"summary\": \"• Critical SQL injection in login\\n• Unencrypted data at rest\\n• Missing rate limiting\"}",
    "attempt": 1,
    "escrow": {
      "escrowId": "escrow-001",
      "amount": 800,
      "bid_id": "bid-001",
      "agent_id": "agent-worker-1"
    }
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-bazaar",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aalok Singh",
    "email": "aalok101singh@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_577": [
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
    "qa_judge_instructor_llmnode_577_system_0": "@prompts/qa-judge_judge_system.md",
    "qa_judge_instructor_llmnode_577_user_1": "@prompts/qa-judge_judge_user.md"
  },
  "modelConfigs": {
    "qa_judge_instructor_llmnode_577_generative_model_name": "@model-configs/qa-judge_text.ts"
  },
  "scripts": {
    "qa_judge_code_node_757_code": "@scripts/qa-judge_release.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"bounty\": {},\n  \"rubric\": {},\n  \"artifact\": \"string\",\n  \"attempt\": \"int\",\n  \"escrow\": {}\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_577",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
          "schema": "{\n  \"type\": \"object\",\n  \"required\": [\"score\", \"verdict\", \"rationale\"],\n  \"additionalProperties\": false,\n  \"properties\": {\n    \"score\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1 },\n    \"verdict\": { \"type\": \"string\", \"enum\": [\"pass\", \"fail\"] },\n    \"rationale\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          { "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b", "role": "system", "content": "@prompts/qa-judge_judge_system.md" },
          { "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d", "role": "user", "content": "@prompts/qa-judge_judge_user.md" }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Judge",
        "attachments": "",
        "generativeModelName": "@model-configs/qa-judge_text.ts"
      }
    }
  },
  {
    "id": "codeNode_757",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/qa-judge_release.ts",
        "nodeName": "Action Router"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"score\": \"{{codeNode_757.output.score}}\",\n  \"verdict\": \"{{codeNode_757.output.verdict}}\",\n  \"rationale\": \"{{codeNode_757.output.rationale}}\",\n  \"rubric_hash\": \"{{codeNode_757.output.rubric_hash}}\",\n  \"action\": \"{{codeNode_757.output.action}}\",\n  \"receiptId\": \"{{codeNode_757.output.receiptId}}\",\n  \"newAttempt\": \"{{codeNode_757.output.newAttempt}}\",\n  \"reason\": \"{{codeNode_757.output.reason}}\"\n}"
      }
    }
  }
];

export const edges = [
  { "id": "triggerNode_1-InstructorLLMNode_577", "source": "triggerNode_1", "target": "InstructorLLMNode_577", "sourceHandle": "bottom", "targetHandle": "top", "type": "defaultEdge" },
  { "id": "InstructorLLMNode_577-codeNode_757", "source": "InstructorLLMNode_577", "target": "codeNode_757", "sourceHandle": "bottom", "targetHandle": "top", "type": "defaultEdge" },
  { "id": "codeNode_757-responseNode_triggerNode_1", "source": "codeNode_757", "target": "responseNode_triggerNode_1", "sourceHandle": "bottom", "targetHandle": "top", "type": "defaultEdge" },
  { "id": "response-trigger_triggerNode_1", "source": "triggerNode_1", "target": "responseNode_triggerNode_1", "sourceHandle": "to-response", "targetHandle": "from-trigger", "type": "responseEdge" }
];

export default { meta, inputs, references, nodes, edges };

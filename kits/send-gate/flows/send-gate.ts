/*
 * # send-gate
 * Pre-send gate for messages that AI agents write to customers.
 *
 * API Request (draft, facts, recipient, policy, needs_fact_check, truth_url)
 *   -> Code [codeNode_211]  extractClaims + optional truth_url fetch + verifyClaims (deterministic, no model)
 *   -> Condition [conditionNode_874]  needsFactCheck == true ?
 *        yes -> Generate JSON [InstructorLLMNode_699]  semantic judge, returns {unsupported_claims, rewrite, notes}
 *        no  -> Code [codeNode_504]  pass-through (fast path, zero model calls)
 *   -> Code [codeNode_515]  decide(): merges judge findings, re-verifies the rewrite, fails closed
 *   -> API Response (verdict, finalMessage, claims, verifications, findings, counts, rewriteCheck, audit)
 *
 * Both Code nodes carry the same library, apps/lib/gate.js, minified by apps/scripts/emit-code-node.mjs.
 * Full documentation: README.md and agent.md in this kit.
 */
// Flow: send-gate

// -- Meta --
export const meta = {
  "name": "send-gate",
  "description": "Pre-send gate for agent-written customer messages: claims JSON -> deterministic verification against a source of truth -> LLM judge only when needed -> re-verified rewrite.",
  "tags": [
    "guardrail",
    "fact-check",
    "hallucination",
    "customer-messaging",
    "deterministic",
    "hinglish"
  ],
  "testInput": {
    "draft": "Namaste! Aapke liye special 20% discount hai, order PO1430779 ka total sirf ₹7,091. Kal subah deliver ho jayega, 100% guaranteed.",
    "facts": "{\"order\": {\"po\": \"PO1430779\", \"status\": \"pending\", \"total\": 8864, \"items\": 10}, \"offers\": [], \"eta\": null}",
    "recipient": "{\"name\": \"Aditya Kirana Store\", \"phone\": \"919045576383\"}",
    "policy": "",
    "needs_fact_check": "",
    "truth_url": ""
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/send-gate",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/blob/main/kits/send-gate/README.md",
  "deployUrl": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/send-gate/apps",
  "author": {
    "name": "Aditya Mukhopadhyay",
    "email": "adul.m.2003@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_699": [
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
    "send_gate_instructor_llmnode_699_system_0": "@prompts/send-gate_instructor-llmnode-699_system_0.md",
    "send_gate_instructor_llmnode_699_user_1": "@prompts/send-gate_instructor-llmnode-699_user_1.md"
  },
  "modelConfigs": {
    "send_gate_instructor_llmnode_699_generative_model_name": "@model-configs/send-gate_instructor-llmnode-699_generative-model-name.ts"
  },
  "scripts": {
    "send_gate_code_node_211_code": "@scripts/send-gate_code-node-211_code.ts",
    "send_gate_code_node_504_code": "@scripts/send-gate_code-node-504_code.ts",
    "send_gate_code_node_515_code": "@scripts/send-gate_code-node-515_code.ts"
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
        "advance_schema": "{\n  \"draft\": \"string\",\n  \"facts\": \"string\",\n  \"recipient\": \"string\",\n  \"policy\": \"string\",\n  \"needs_fact_check\": \"string\",\n  \"truth_url\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_211",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/send-gate_code-node-211_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "conditionNode_874",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_874-addNode_766",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_211.output.needsFactCheck}}\",\n      \"operator\": \"==\",\n      \"value\": \"true\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_874-addNode_919",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_504",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/send-gate_code-node-504_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "InstructorLLMNode_699",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"unsupported_claims\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"claim\": {\n            \"type\": \"string\"\n          },\n          \"why\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"rewrite\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"notes\": {\n      \"type\": \"string\",\n      \"required\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/send-gate_instructor-llmnode-699_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/send-gate_instructor-llmnode-699_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/send-gate_instructor-llmnode-699_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_515",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/send-gate_code-node-515_code.ts",
        "nodeName": "Code"
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
        "outputMapping": "{\n  \"verdict\": \"{{codeNode_515.output.verdict}}\",\n  \"finalMessage\": \"{{codeNode_515.output.finalMessage}}\",\n  \"claims\": \"{{codeNode_515.output.claims}}\",\n  \"verifications\": \"{{codeNode_515.output.verifications}}\",\n  \"findings\": \"{{codeNode_515.output.findings}}\",\n  \"counts\": \"{{codeNode_515.output.counts}}\",\n  \"rewriteCheck\": \"{{codeNode_515.output.rewriteCheck}}\",\n  \"audit\": \"{{codeNode_515.output.audit}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_211",
    "source": "triggerNode_1",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_211-conditionNode_874",
    "source": "codeNode_211",
    "target": "conditionNode_874",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_874-addNode_766",
    "source": "conditionNode_874",
    "target": "InstructorLLMNode_699",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_874-addNode_919",
    "source": "conditionNode_874",
    "target": "codeNode_504",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_699-codeNode_515",
    "source": "InstructorLLMNode_699",
    "target": "codeNode_515",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_515-responseNode_triggerNode_1",
    "source": "codeNode_515",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__codeNode_504bottom-codeNode_515top",
    "source": "codeNode_504",
    "target": "codeNode_515",
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

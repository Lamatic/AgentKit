// Flow: mou-drafter

// -- Meta --
export const meta = {
  "name": "mou-drafter",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Rohith Rathod",
    "email": "banothrohithrathod@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_842": [
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
    "mou_drafter_llmnode_842_system_0": "@prompts/mou-drafter_llmnode-842_system_0.md",
    "mou_drafter_llmnode_842_user_1": "@prompts/mou-drafter_llmnode-842_user_1.md"
  },
  "modelConfigs": {
    "mou_drafter_llmnode_842_generative_model_name": "@model-configs/mou-drafter_llmnode-842_generative-model-name.ts"
  },
  "scripts": {
    "mou_drafter_code_node_316_code": "@scripts/mou-drafter_code-node-316_code.ts",
    "mou_drafter_code_node_138_code": "@scripts/mou-drafter_code-node-138_code.ts"
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
        "advance_schema": "{\n  \"agreementTitle\": \"string\",\n  \"effectiveDate\": \"string\",\n  \"partyAName\": \"string\",\n  \"partyAType\": \"string\",\n  \"partyAAddress\": \"string\",\n  \"partyASignatory\": \"string\",\n  \"partyASignatoryRole\": \"string\",\n  \"partyAEmail\": \"string\",\n  \"partyBName\": \"string\",\n  \"partyBType\": \"string\",\n  \"partyBAddress\": \"string\",\n  \"partyBSignatory\": \"string\",\n  \"partyBSignatoryRole\": \"string\",\n  \"partyBEmail\": \"string\",\n  \"engagementType\": \"string\",\n  \"scopeOfWork\": \"string\",\n  \"deliverables\": \"string\",\n  \"totalFeeAmount\": \"float\",\n  \"totalFeeCurrency\": \"string\",\n  \"paymentSchedule\": \"string\",\n  \"paymentPreset\": \"string\",\n  \"customDepositPct\": \"float\",\n  \"customPaymentDays\": \"int\",\n  \"eventStart\": \"string\",\n  \"eventEnd\": \"string\",\n  \"confidentialityRequired\": \"bool\",\n  \"confidentialitySurvivalYears\": \"int\",\n  \"ipOwnership\": \"string\",\n  \"ipPortfolioRights\": \"bool\",\n  \"terminationPreset\": \"string\",\n  \"governingLaw\": \"string\",\n  \"disputeResolution\": \"string\",\n  \"disputeVenue\": \"string\",\n  \"insuranceRequired\": \"bool\",\n  \"insuranceGenLiab\": \"float\",\n  \"insuranceProfIndem\": \"float\",\n  \"dataProtectionRequired\": \"bool\",\n  \"subcontractingAllowed\": \"bool\",\n  \"noPublicityRequired\": \"bool\",\n  \"liabilityCapMultiplier\": \"int\",\n  \"additionalContext\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_316",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/mou-drafter_code-node-316_code.ts",
        "nodeName": "validate-input"
      }
    }
  },
  {
    "id": "LLMNode_842",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/mou-drafter_llmnode-842_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/mou-drafter_llmnode-842_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "clause-generator",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/mou-drafter_llmnode-842_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_138",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/mou-drafter_code-node-138_code.ts",
        "nodeName": "assemble-latex"
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
        "outputMapping": "{\n  \"output\": \"{{codeNode_138.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_316",
    "source": "triggerNode_1",
    "target": "codeNode_316",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_316-LLMNode_842",
    "source": "codeNode_316",
    "target": "LLMNode_842",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_842-codeNode_138",
    "source": "LLMNode_842",
    "target": "codeNode_138",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_138-responseNode_triggerNode_1",
    "source": "codeNode_138",
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

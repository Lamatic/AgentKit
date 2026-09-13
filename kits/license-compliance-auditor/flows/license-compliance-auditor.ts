// Flow: license-compliance-auditor

// -- Meta --
export const meta = {
  "name": "license-compliance-auditor",
  "description": "Scans a project's dependency licenses, flags copyleft/GPL-family risk against an allow-list, and generates a markdown compliance report.",
  "tags": ["compliance", "open-source", "licensing"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Arekatla Nishanth Chowdary",
    "email": "cs@nlnassociates.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_430": [
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
    "license_compliance_auditor_llmnode_430_system_0": "@prompts/license-compliance-auditor_llmnode-430_system_0.md",
    "license_compliance_auditor_llmnode_430_user_1": "@prompts/license-compliance-auditor_llmnode-430_user_1.md"
  },
  "modelConfigs": {
    "license_compliance_auditor_llmnode_430_generative_model_name": "@model-configs/license-compliance-auditor_llmnode-430_generative-model-name.ts"
  },
  "scripts": {
    "license_compliance_auditor_code_node_210_code": "@scripts/license-compliance-auditor_code-node-210_code.ts"
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
        "nodeName": "Compliance Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"dependency_licenses\": \"string\",\n  \"allow_list\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_210",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/license-compliance-auditor_code-node-210_code.ts",
        "nodeName": "Classify Licenses"
      }
    }
  },
  {
    "id": "LLMNode_430",
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
            "id": "2f9a1c3e-7b4d-4e2a-9c1f-5a8e6d3b2c10",
            "role": "system",
            "content": "@prompts/license-compliance-auditor_llmnode-430_system_0.md"
          },
          {
            "id": "2f9a1c3e-7b4d-4e2a-9c1f-5a8e6d3b2c11",
            "role": "user",
            "content": "@prompts/license-compliance-auditor_llmnode-430_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Report",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/license-compliance-auditor_llmnode-430_generative-model-name.ts"
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
        "nodeName": "Compliance Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"report\": \"{{LLMNode_430.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_210",
    "source": "triggerNode_1",
    "target": "codeNode_210",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_210-LLMNode_430",
    "source": "codeNode_210",
    "target": "LLMNode_430",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_430-responseNode_triggerNode_1",
    "source": "LLMNode_430",
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

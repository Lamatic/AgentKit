// Flow: vendor-risk-assessment-agent-v2

// -- Meta --
export const meta = {
  "name": "Vendor Risk Assessment Agent V2",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Rishabh Rajput",
    "email": "rishabhrajput150102@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_538": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_644": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_122": [
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
    "vendor_risk_assessment_agent_v2_llmnode_538_system_0": "@prompts/vendor-risk-assessment-agent-v2_llmnode-538_system_0.md",
    "vendor_risk_assessment_agent_v2_llmnode_538_user_1": "@prompts/vendor-risk-assessment-agent-v2_llmnode-538_user_1.md",
    "vendor_risk_assessment_agent_v2_llmnode_644_system_0": "@prompts/vendor-risk-assessment-agent-v2_llmnode-644_system_0.md",
    "vendor_risk_assessment_agent_v2_llmnode_644_user_1": "@prompts/vendor-risk-assessment-agent-v2_llmnode-644_user_1.md",
    "vendor_risk_assessment_agent_v2_llmnode_122_system_0": "@prompts/vendor-risk-assessment-agent-v2_llmnode-122_system_0.md",
    "vendor_risk_assessment_agent_v2_llmnode_122_user_1": "@prompts/vendor-risk-assessment-agent-v2_llmnode-122_user_1.md"
  },
  "modelConfigs": {
    "vendor_risk_assessment_agent_v2_llmnode_538_generative_model_name": "@model-configs/vendor-risk-assessment-agent-v2_llmnode-538_generative-model-name.ts",
    "vendor_risk_assessment_agent_v2_llmnode_644_generative_model_name": "@model-configs/vendor-risk-assessment-agent-v2_llmnode-644_generative-model-name.ts",
    "vendor_risk_assessment_agent_v2_llmnode_122_generative_model_name": "@model-configs/vendor-risk-assessment-agent-v2_llmnode-122_generative-model-name.ts"
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
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\"sampleInput\":\"string\"}"
      }
    }
  },
  {
    "id": "LLMNode_538",
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
            "content": "@prompts/vendor-risk-assessment-agent-v2_llmnode-538_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/vendor-risk-assessment-agent-v2_llmnode-538_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Vendor Information Extractor",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/vendor-risk-assessment-agent-v2_llmnode-538_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_644",
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
            "content": "@prompts/vendor-risk-assessment-agent-v2_llmnode-644_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/vendor-risk-assessment-agent-v2_llmnode-644_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Risk Assessment Agent",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/vendor-risk-assessment-agent-v2_llmnode-644_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_122",
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
            "content": "@prompts/vendor-risk-assessment-agent-v2_llmnode-122_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/vendor-risk-assessment-agent-v2_llmnode-122_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Recommendation Agent",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/vendor-risk-assessment-agent-v2_llmnode-122_generative-model-name.ts"
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
        "outputMapping": "{\n  \"vendor_information\": \"{{LLMNode_538.output.generatedResponse}}\",\n  \"riskAssessment\": \"{{LLMNode_644.output.generatedResponse}}\",\n  \"recommendations\": \"{{LLMNode_122.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_538",
    "source": "triggerNode_1",
    "target": "LLMNode_538",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_538-LLMNode_644",
    "source": "LLMNode_538",
    "target": "LLMNode_644",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_644-LLMNode_122",
    "source": "LLMNode_644",
    "target": "LLMNode_122",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_122-responseNode_triggerNode_1",
    "source": "LLMNode_122",
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

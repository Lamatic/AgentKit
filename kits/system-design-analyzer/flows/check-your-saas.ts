// Flow: check-your-saas

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Check Your Saas",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "classifier": [
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
  ],
  "component_parser": [
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
  ],
  "performance_agent": [
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
  ],
  "reliability_agent": [
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
  ],
  "consistency_agent": [
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
  ],
  "security_agent": [
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
  ],
  "cost_agent": [
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
  ],
  "judge_agent": [
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
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "check_your_saas_system_classifier_system": "@prompts/check-your-saas_system-classifier_system.md",
    "check_your_saas_system_classifier_user": "@prompts/check-your-saas_system-classifier_user.md",
    "check_your_saas_component_parser_system": "@prompts/check-your-saas_component-parser_system.md",
    "check_your_saas_component_parser_user": "@prompts/check-your-saas_component-parser_user.md",
    "check_your_saas_performance_agent_system": "@prompts/check-your-saas_performance-agent_system.md",
    "check_your_saas_performance_agent_user": "@prompts/check-your-saas_performance-agent_user.md",
    "check_your_saas_reliability_agent_system": "@prompts/check-your-saas_reliability-agent_system.md",
    "check_your_saas_reliability_agent_user": "@prompts/check-your-saas_reliability-agent_user.md",
    "check_your_saas_consistency_agent_system": "@prompts/check-your-saas_consistency-agent_system.md",
    "check_your_saas_consistency_agent_user": "@prompts/check-your-saas_consistency-agent_user.md",
    "check_your_saas_security_agent_system": "@prompts/check-your-saas_security-agent_system.md",
    "check_your_saas_security_agent_user": "@prompts/check-your-saas_security-agent_user.md",
    "check_your_saas_cost_agent_system": "@prompts/check-your-saas_cost-agent_system.md",
    "check_your_saas_cost_agent_user": "@prompts/check-your-saas_cost-agent_user.md",
    "check_your_saas_judge_agent_system": "@prompts/check-your-saas_judge-agent_system.md",
    "check_your_saas_judge_agent_user": "@prompts/check-your-saas_judge-agent_user.md"
  },
  "scripts": {
    "check_your_saas_clean_extract_metadata": "@scripts/check-your-saas_clean-extract-metadata.ts"
  },
  "modelConfigs": {
    "check_your_saas_system_classifier": "@model-configs/check-your-saas_system-classifier.ts",
    "check_your_saas_component_parser": "@model-configs/check-your-saas_component-parser.ts",
    "check_your_saas_performance_agent": "@model-configs/check-your-saas_performance-agent.ts",
    "check_your_saas_reliability_agent": "@model-configs/check-your-saas_reliability-agent.ts",
    "check_your_saas_consistency_agent": "@model-configs/check-your-saas_consistency-agent.ts",
    "check_your_saas_security_agent": "@model-configs/check-your-saas_security-agent.ts",
    "check_your_saas_cost_agent": "@model-configs/check-your-saas_cost-agent.ts",
    "check_your_saas_judge_agent": "@model-configs/check-your-saas_judge-agent.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "schema": {
        "sampleOutput": "string"
      },
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"system_design\": \"string\"\n}\n"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 685,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "classifier",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "classifier",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"primary_domain\": { \"type\": \"string\" },\n    \"scale_tier\": { \"type\": \"string\" },\n    \"consistency_requirement\": { \"type\": \"string\" },\n    \"latency_sensitivity\": { \"type\": \"string\" },\n    \"availability_requirement\": { \"type\": \"string\" },\n    \"key_constraints\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"architectural_style\": { \"type\": \"string\" }\n  },\n  \"required\": [\"primary_domain\", \"scale_tier\"]\n}\n",
        "prompts": [
          {
            "id": "classifier-system",
            "role": "system",
            "content": "@prompts/check-your-saas_system-classifier_system.md"
          },
          {
            "id": "classifier-user",
            "role": "user",
            "content": "@prompts/check-your-saas_system-classifier_user.md"
          }
        ],
        "nodeName": "System Classifier",
        "generativeModelName": "@model-configs/check-your-saas_system-classifier.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 460,
      "y": 260
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "component_parser",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "component_parser",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"components\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"data_flow\": { \"type\": \"string\" },\n    \"critical_paths\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"failure_domains\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"explicit_gaps\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"components\", \"data_flow\"]\n}\n",
        "prompts": [
          {
            "id": "parser-system",
            "role": "system",
            "content": "@prompts/check-your-saas_component-parser_system.md"
          },
          {
            "id": "parser-user",
            "role": "user",
            "content": "@prompts/check-your-saas_component-parser_user.md"
          }
        ],
        "nodeName": "Component Parser",
        "generativeModelName": "@model-configs/check-your-saas_component-parser.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 1125,
      "y": 260
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "performance_agent",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "performance_agent",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"bottlenecks\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"bottlenecks\"]\n}\n",
        "prompts": [
          {
            "id": "perf-system",
            "role": "system",
            "content": "@prompts/check-your-saas_performance-agent_system.md"
          },
          {
            "id": "perf-user",
            "role": "user",
            "content": "@prompts/check-your-saas_performance-agent_user.md"
          }
        ],
        "nodeName": "Performance Agent",
        "generativeModelName": "@model-configs/check-your-saas_performance-agent.ts"
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
    "selected": false,
    "draggable": false
  },
  {
    "id": "reliability_agent",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "reliability_agent",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"failure_scenarios\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"failure_scenarios\"]\n}\n",
        "prompts": [
          {
            "id": "rel-system",
            "role": "system",
            "content": "@prompts/check-your-saas_reliability-agent_system.md"
          },
          {
            "id": "rel-user",
            "role": "user",
            "content": "@prompts/check-your-saas_reliability-agent_user.md"
          }
        ],
        "nodeName": "Reliability Agent",
        "generativeModelName": "@model-configs/check-your-saas_reliability-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 390
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "consistency_agent",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "consistency_agent",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"consistency_issues\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"consistency_issues\"]\n}\n",
        "prompts": [
          {
            "id": "cons-system",
            "role": "system",
            "content": "@prompts/check-your-saas_consistency-agent_system.md"
          },
          {
            "id": "cons-user",
            "role": "user",
            "content": "@prompts/check-your-saas_consistency-agent_user.md"
          }
        ],
        "nodeName": "Consistency Agent",
        "generativeModelName": "@model-configs/check-your-saas_consistency-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 900,
      "y": 390
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "security_agent",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "security_agent",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"security_risks\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"security_risks\"]\n}\n",
        "prompts": [
          {
            "id": "sec-system",
            "role": "system",
            "content": "@prompts/check-your-saas_security-agent_system.md"
          },
          {
            "id": "sec-user",
            "role": "user",
            "content": "@prompts/check-your-saas_security-agent_user.md"
          }
        ],
        "nodeName": "Security Agent",
        "generativeModelName": "@model-configs/check-your-saas_security-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 1350,
      "y": 390
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "cost_agent",
    "data": {
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "cost_agent",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"cost_issues\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"cost_issues\"]\n}\n",
        "prompts": [
          {
            "id": "cost-system",
            "role": "system",
            "content": "@prompts/check-your-saas_cost-agent_system.md"
          },
          {
            "id": "cost-user",
            "role": "user",
            "content": "@prompts/check-your-saas_cost-agent_user.md"
          }
        ],
        "nodeName": "Cost Agent",
        "generativeModelName": "@model-configs/check-your-saas_cost-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 1810,
      "y": 390
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "judge_agent",
    "data": {
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "judge_agent",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"critical_issues\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"top_recommendations\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"summary\": { \"type\": \"string\" }\n  },\n  \"required\": [\"critical_issues\", \"summary\"]\n}\n",
        "prompts": [
          {
            "id": "judge-system",
            "role": "system",
            "content": "@prompts/check-your-saas_judge-agent_system.md"
          },
          {
            "id": "judge-user",
            "role": "user",
            "content": "@prompts/check-your-saas_judge-agent_user.md"
          }
        ],
        "nodeName": "Judge Agent",
        "generativeModelName": "@model-configs/check-your-saas_judge-agent.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 675,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "preprocess",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "design": "string",
        "line_count": "number",
        "word_count": "number",
        "mentions_geo": "boolean",
        "has_scale_numbers": "boolean",
        "mentions_realtime": "boolean",
        "mentions_financial": "boolean"
      },
      "values": {
        "id": "preprocess",
        "code": "@scripts/check-your-saas_clean-extract-metadata.ts",
        "nodeName": "Clean & Extract Metadata"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 685,
      "y": 130
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "responseNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlResponseNode",
      "schema": {},
      "values": {
        "id": "responseNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"issues\": \"{{judge_agent.output.critical_issues}}\",\n  \"recommendations\": \"{{judge_agent.output.top_recommendations}}\",\n  \"summary\": \"{{judge_agent.output.summary}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 675,
      "y": 650
    },
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-preprocess",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "preprocess",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "preprocess-classifier",
    "type": "defaultEdge",
    "source": "preprocess",
    "target": "classifier",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "preprocess-component_parser",
    "type": "defaultEdge",
    "source": "preprocess",
    "target": "component_parser",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "classifier-performance_agent",
    "type": "defaultEdge",
    "source": "classifier",
    "target": "performance_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "component_parser-performance_agent",
    "type": "defaultEdge",
    "source": "component_parser",
    "target": "performance_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "classifier-reliability_agent",
    "type": "defaultEdge",
    "source": "classifier",
    "target": "reliability_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "component_parser-reliability_agent",
    "type": "defaultEdge",
    "source": "component_parser",
    "target": "reliability_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "classifier-consistency_agent",
    "type": "defaultEdge",
    "source": "classifier",
    "target": "consistency_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "component_parser-consistency_agent",
    "type": "defaultEdge",
    "source": "component_parser",
    "target": "consistency_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "classifier-security_agent",
    "type": "defaultEdge",
    "source": "classifier",
    "target": "security_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "component_parser-security_agent",
    "type": "defaultEdge",
    "source": "component_parser",
    "target": "security_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "classifier-cost_agent",
    "type": "defaultEdge",
    "source": "classifier",
    "target": "cost_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "component_parser-cost_agent",
    "type": "defaultEdge",
    "source": "component_parser",
    "target": "cost_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "classifier-judge_agent",
    "type": "defaultEdge",
    "source": "classifier",
    "target": "judge_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "performance_agent-judge_agent",
    "type": "defaultEdge",
    "source": "performance_agent",
    "target": "judge_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "reliability_agent-judge_agent",
    "type": "defaultEdge",
    "source": "reliability_agent",
    "target": "judge_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "consistency_agent-judge_agent",
    "type": "defaultEdge",
    "source": "consistency_agent",
    "target": "judge_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "security_agent-judge_agent",
    "type": "defaultEdge",
    "source": "security_agent",
    "target": "judge_agent",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "cost_agent-judge_agent",
    "type": "defaultEdge",
    "source": "cost_agent",
    "target": "judge_agent",
    "selected": false,
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "judge_agent-responseNode_1",
    "type": "defaultEdge",
    "source": "judge_agent",
    "target": "responseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

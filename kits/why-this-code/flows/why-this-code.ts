// Flow: why-this-code

// -- Meta --
export const meta = {
  "name": "Why This Code",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Shubham Thakur",
    "email": "reach.shubhamthakur@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_662": [
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
    "why_this_code_instructor_llmnode_662_system_0": "@prompts/why-this-code_instructor-llmnode-662_system_0.md",
    "why_this_code_instructor_llmnode_662_user_1": "@prompts/why-this-code_instructor-llmnode-662_user_1.md"
  },
  "modelConfigs": {
    "why_this_code_instructor_llmnode_662_generative_model_name": "@model-configs/why-this-code_instructor-llmnode-662_generative-model-name.ts"
  },
  "scripts": {
    "why_this_code_code_node_360_code": "@scripts/why-this-code_code-node-360_code.ts",
    "why_this_code_code_node_366_code": "@scripts/why-this-code_code-node-366_code.ts",
    "why_this_code_code_node_171_code": "@scripts/why-this-code_code-node-171_code.ts",
    "why_this_code_code_node_325_code": "@scripts/why-this-code_code-node-325_code.ts",
    "why_this_code_code_node_561_code": "@scripts/why-this-code_code-node-561_code.ts",
    "why_this_code_code_node_616_code": "@scripts/why-this-code_code-node-616_code.ts",
    "why_this_code_code_node_508_code": "@scripts/why-this-code_code-node-508_code.ts"
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
        "advance_schema": "{\n  \"url\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_360",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-360_code.ts",
        "nodeName": "Resolve Reference & Validation"
      }
    }
  },
  {
    "id": "conditionNode_253",
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
            "value": "conditionNode_253-addNode_135",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_360.output.status}}\",\n      \"operator\": \"==\",\n      \"value\": \"success\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_253-addNode_102",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_366",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-366_code.ts",
        "nodeName": "Explore Repo"
      }
    }
  },
  {
    "id": "codeNode_171",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-171_code.ts",
        "nodeName": "Find Docs"
      }
    }
  },
  {
    "id": "codeNode_325",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-325_code.ts",
        "nodeName": "Trace History"
      }
    }
  },
  {
    "id": "codeNode_561",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-561_code.ts",
        "nodeName": "Trace Discussions"
      }
    }
  },
  {
    "id": "codeNode_616",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-616_code.ts",
        "nodeName": "Search Codebase"
      }
    }
  },
  {
    "id": "codeNode_508",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/why-this-code_code-node-508_code.ts",
        "nodeName": "Trim Larger files"
      }
    }
  },
  {
    "id": "InstructorLLMNode_662",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"aiResponse\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"unifiedPurpose\": {\n          \"type\": \"string\",\n          \"required\": true,\n          \"description\": \"1-2 sentence description explaining the primary purpose of the reference.\"\n        },\n        \"purposeBasis\": {\n          \"type\": \"string\",\n          \"required\": true,\n          \"description\": \"What unifiedPurpose was actually grounded in. Use insufficient-evidence when PR/issue bodies contain no real reasoning and the issue title itself is too generic to support a claim.\"\n        },\n        \"coverageDashboard\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"commitHistory\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"Status tag for commit history coverage (STRONG, WEAK, or NOT FOUND)\"\n            },\n            \"prsIssues\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"Status tag for linked PRs and issues coverage (STRONG, WEAK, or NOT FOUND)\"\n            },\n            \"documentation\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"Status tag for README and docstring coverage (STRONG, WEAK, or NOT FOUND)\"\n            },\n            \"invocations\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"Status tag for cross-file and same-file usages (STRONG, WEAK, or NOT FOUND)\"\n            }\n          },\n          \"description\": \"Dashboard containing the search status tags of all context components\",\n          \"additionalProperties\": true\n        },\n        \"originHistory\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"summary\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"States whether the symbol was created whole in a single commit or evolved across multiple commits, based only on history.commits and originFound.\"\n            },\n            \"originCommitFound\": {\n              \"type\": \"boolean\",\n              \"required\": true,\n              \"description\": \"True if the original commit that introduced the range was identified\"\n            }\n          },\n          \"description\": \"Details about the code range's origin and git commit history. Do not include verbatim commit SHAs or PR/issue bodies here — those are merged in downstream from source data.\",\n          \"additionalProperties\": true\n        },\n        \"usagePattern\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"summary\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"Narrative explaining how this class/function is used across consuming files.\"\n            },\n            \"externalCrossFile\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"object\",\n                \"properties\": {\n                  \"path\": {\n                    \"type\": \"string\",\n                    \"required\": true,\n                    \"description\": \"File path of the importing file.\"\n                  },\n                  \"resolvedLocalName\": {\n                    \"type\": \"string\",\n                    \"required\": true,\n                    \"description\": \"Name under which the symbol is imported (handles aliasing).\"\n                  },\n                  \"invocations\": {\n                    \"type\": \"array\",\n                    \"items\": {\n                      \"type\": \"object\",\n                      \"properties\": {\n                        \"line\": {\n                          \"type\": \"string\",\n                          \"required\": true\n                        },\n                        \"snippet\": {\n                          \"type\": \"string\",\n                          \"required\": true\n                        },\n                        \"kind\": {\n                          \"type\": \"string\",\n                          \"required\": true,\n                          \"description\": \"Mechanical classification of the invocation. Use other rather than forcing a poor fit.\"\n                        }\n                      },\n                      \"additionalProperties\": true\n                    }\n                  }\n                },\n                \"additionalProperties\": true\n              },\n              \"description\": \"List of other codebase files importing the target symbol, with classified invocation slices.\"\n            }\n          },\n          \"description\": \"Detailed external import references and line usage invocations in the codebase\",\n          \"additionalProperties\": true\n        },\n        \"architecturalIntent\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"summary\": {\n              \"type\": \"string\",\n              \"required\": true,\n              \"description\": \"The symbol's structural role (e.g. singleton orchestrator vs. transient helper), grounded in dependencies and usagePattern above.\"\n            },\n            \"dependencies\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              },\n              \"description\": \"Dependencies extracted specifically from the constructor's parameter list — not general file-level imports.\"\n            },\n            \"notes\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              },\n              \"description\": \"Short strings prefixed GAP: or WARNING: — evidence gaps (thin discussion, missing docs), docstring/behavior mismatches, or explicit deprecation warnings found in source.\"\n            }\n          },\n          \"description\": \"Evaluation of design conventions, dependencies, and evidence gaps or warnings\",\n          \"additionalProperties\": true\n        }\n      },\n      \"description\": \"AI Response\",\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/why-this-code_instructor-llmnode-662_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/why-this-code_instructor-llmnode-662_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "LLM Call",
        "attachments": "",
        "generativeModelName": "@model-configs/why-this-code_instructor-llmnode-662_generative-model-name.ts"
      }
    }
  },
  {
    "id": "addNode_102",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
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
        "outputMapping": "{\n  \"aiResponse\": \"{{InstructorLLMNode_662.output.aiResponse}}\",\n  \"context\": {\n    \"owner\": \"{{codeNode_616.output.owner}}\",\n    \"repo\": \"{{codeNode_616.output.repo}}\",\n    \"ref\": \"{{codeNode_616.output.ref}}\",\n    \"path\": \"{{codeNode_616.output.path}}\",\n    \"profile\": \"{{codeNode_616.output.profile}}\",\n    \"fileContent\": \"{{codeNode_616.output.fileContent}}\",\n    \"startLine\": \"{{codeNode_616.output.startLine}}\",\n    \"endLine\": \"{{codeNode_616.output.endLine}}\",\n    \"declarationValid\": \"{{codeNode_616.output.declarationValid}}\",\n    \"symbolName\": \"{{codeNode_616.output.symbolName}}\",\n    \"docstring\": \"{{codeNode_616.output.docstring}}\",\n    \"history\": \"{{codeNode_616.output.history}}\",\n    \"discussions\": \"{{codeNode_616.output.discussions}}\",\n    \"usages\": \"{{codeNode_616.output.usages}}\",\n    \"usage\": \"{{codeNode_616.output.usage}}\"\n  },\n  \"status\": \"{{codeNode_360.output.status}}\",\n  \"validationError\": \"{{codeNode_360.output.validationError}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "codeNode_360-conditionNode_253",
    "source": "codeNode_360",
    "target": "conditionNode_253",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_253-addNode_102",
    "source": "conditionNode_253",
    "target": "addNode_102",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_366-codeNode_171",
    "source": "codeNode_366",
    "target": "codeNode_171",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_171-codeNode_325",
    "source": "codeNode_171",
    "target": "codeNode_325",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_325-codeNode_561",
    "source": "codeNode_325",
    "target": "codeNode_561",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_561-codeNode_616",
    "source": "codeNode_561",
    "target": "codeNode_616",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_616-codeNode_508",
    "source": "codeNode_616",
    "target": "codeNode_508",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_102-responseNode_triggerNode_1-593",
    "source": "addNode_102",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_508-InstructorLLMNode_662",
    "source": "codeNode_508",
    "target": "InstructorLLMNode_662",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_662-responseNode_triggerNode_1-569",
    "source": "InstructorLLMNode_662",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_253-codeNode_366-623",
    "source": "conditionNode_253",
    "target": "codeNode_366",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "triggerNode_1-codeNode_360-388",
    "source": "triggerNode_1",
    "target": "codeNode_360",
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

// Flow: repo-analyzer

// -- Meta --
export const meta = {
  "name": "repo-analyzer",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Himanshu Kaushik",
    "email": "hk9797592893@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_246": [
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
    "repo_analyzer_instructor_llmnode_246_system_0": "@prompts/repo-analyzer_instructor-llmnode-246_system_0.md",
    "repo_analyzer_instructor_llmnode_246_user_1": "@prompts/repo-analyzer_instructor-llmnode-246_user_1.md"
  },
  "modelConfigs": {
    "repo_analyzer_instructor_llmnode_246_generative_model_name": "@model-configs/repo-analyzer_instructor-llmnode-246_generative-model-name.ts"
  },
  "scripts": {
    "repo_analyzer_code_node_101_code": "@scripts/repo-analyzer_code-node-101_code.ts",
    "repo_analyzer_code_node_301_code": "@scripts/repo-analyzer_code-node-301_code.ts"
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
        "responeType": "async",
        "advance_schema": "{\n  \"repo_url\": \"string\",\n  \"developer_role\": \"string\",\n  \"github_token\": \"string?\"\n}"
      }
    }
  },
  {
    "id": "codeNode_101",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_101",
        "code": "@scripts/repo-analyzer_code-node-101_code.ts",
        "nodeName": "Parse_Repo_URL"
      }
    }
  },
  {
    "id": "apiNode_205",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_205",
        "url": "https://api.github.com/repos/{{codeNode_101.output.owner}}/{{codeNode_101.output.repo}}/contents/go.mod",
        "body": "",
        "method": "GET",
        "headers": "{{codeNode_101.output.headers}}",
        "retries": "0",
        "nodeName": "Fetch_GoMod",
        "retry_delay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "apiNode_204",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_204",
        "url": "https://api.github.com/repos/{{codeNode_101.output.owner}}/{{codeNode_101.output.repo}}/contents/pyproject.toml",
        "body": "",
        "method": "GET",
        "headers": "{{codeNode_101.output.headers}}",
        "retries": "0",
        "nodeName": "Fetch_PyProject",
        "retry_delay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "apiNode_203",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_203",
        "url": "https://api.github.com/repos/{{codeNode_101.output.owner}}/{{codeNode_101.output.repo}}/contents/package.json",
        "body": "",
        "method": "GET",
        "headers": "{{codeNode_101.output.headers}}",
        "retries": "0",
        "nodeName": "Fetch_PackageJSON",
        "retry_delay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "apiNode_202",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_202",
        "url": "https://api.github.com/repos/{{codeNode_101.output.owner}}/{{codeNode_101.output.repo}}/contents/README.md",
        "body": "",
        "method": "GET",
        "headers": "{{codeNode_101.output.headers}}",
        "retries": "1",
        "nodeName": "Fetch_README",
        "retry_delay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "apiNode_201",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_201",
        "url": "https://api.github.com/repos/{{codeNode_101.output.owner}}/{{codeNode_101.output.repo}}/git/trees/HEAD?recursive=1",
        "body": "",
        "method": "GET",
        "headers": "{{codeNode_101.output.headers}}",
        "retries": "1",
        "nodeName": "Fetch_File_Tree",
        "retry_delay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "InstructorLLMNode_246",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_246",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"projectOverview\": {\n      \"type\": \"string\"\n    },\n    \"techStack\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"folderStructure\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"path\": {\n            \"type\": \"string\"\n          },\n          \"description\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"path\",\n          \"description\"\n        ]\n      }\n    },\n    \"keyFiles\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"file\": {\n            \"type\": \"string\"\n          },\n          \"whyImportant\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"file\",\n          \"whyImportant\"\n        ]\n      }\n    },\n    \"setupSteps\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"architectureNotes\": {\n      \"type\": \"string\"\n    },\n    \"quiz\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"question\": {\n            \"type\": \"string\"\n          },\n          \"answer\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"question\",\n          \"answer\"\n        ]\n      }\n    }\n  },\n  \"required\": [\n    \"projectOverview\",\n    \"techStack\",\n    \"folderStructure\",\n    \"keyFiles\",\n    \"setupSteps\",\n    \"architectureNotes\",\n    \"quiz\"\n  ]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/repo-analyzer_instructor-llmnode-246_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/repo-analyzer_instructor-llmnode-246_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate_Onboarding_Guide",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/repo-analyzer_instructor-llmnode-246_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_301",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_301",
        "code": "@scripts/repo-analyzer_code-node-301_code.ts",
        "nodeName": "Process_Repo_Data"
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
        "outputMapping": "{\n  \"projectOverview\": \"{{InstructorLLMNode_246.output.projectOverview}}\",\n  \"techStack\": \"{{InstructorLLMNode_246.output.techStack}}\",\n  \"folderStructure\": \"{{InstructorLLMNode_246.output.folderStructure}}\",\n  \"keyFiles\": \"{{InstructorLLMNode_246.output.keyFiles}}\",\n  \"setupSteps\": \"{{InstructorLLMNode_246.output.setupSteps}}\",\n  \"architectureNotes\": \"{{InstructorLLMNode_246.output.architectureNotes}}\",\n  \"quiz\": \"{{InstructorLLMNode_246.output.quiz}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_101",
    "source": "triggerNode_1",
    "target": "codeNode_101",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_101-apiNode_205",
    "source": "codeNode_101",
    "target": "apiNode_205",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_101-apiNode_204",
    "source": "codeNode_101",
    "target": "apiNode_204",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_101-apiNode_203",
    "source": "codeNode_101",
    "target": "apiNode_203",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_101-apiNode_202",
    "source": "codeNode_101",
    "target": "apiNode_202",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_101-apiNode_201",
    "source": "codeNode_101",
    "target": "apiNode_201",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_201-codeNode_301",
    "source": "apiNode_201",
    "target": "codeNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_202-codeNode_301",
    "source": "apiNode_202",
    "target": "codeNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_203-codeNode_301",
    "source": "apiNode_203",
    "target": "codeNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_204-codeNode_301",
    "source": "apiNode_204",
    "target": "codeNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_205-codeNode_301",
    "source": "apiNode_205",
    "target": "codeNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_301-InstructorLLMNode_246",
    "source": "codeNode_301",
    "target": "InstructorLLMNode_246",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_246-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_246",
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

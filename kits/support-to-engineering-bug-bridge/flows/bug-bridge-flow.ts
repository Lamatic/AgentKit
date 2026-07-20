// Flow: bug-bridge-flow

// -- Meta --
export const meta = {
  "name": "bug-bridge-flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Kavya Raghavendran",
    "email": "kavyaraghavendran10@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "searchNode_833": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_809": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "vectorizeNode_681": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_729": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ],
  "vectorizeNode_584": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_444": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ],
  "vectorizeNode_970": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_423": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ],
  "vectorizeNode_926": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_219": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ],
  "vectorizeNode_995": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_867": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "bug_bridge_flow_instructor_llmnode_809_system_0": "@prompts/bug-bridge-flow_instructor-llmnode-809_system_0.md",
    "bug_bridge_flow_instructor_llmnode_809_user_1": "@prompts/bug-bridge-flow_instructor-llmnode-809_user_1.md"
  },
  "modelConfigs": {
    "bug_bridge_flow_search_node_833_embedding_model_name": "@model-configs/bug-bridge-flow_search-node-833_embedding-model-name.ts",
    "bug_bridge_flow_instructor_llmnode_809_generative_model_name": "@model-configs/bug-bridge-flow_instructor-llmnode-809_generative-model-name.ts",
    "bug_bridge_flow_vectorize_node_681_embedding_model_name": "@model-configs/bug-bridge-flow_vectorize-node-681_embedding-model-name.ts",
    "bug_bridge_flow_vectorize_node_584_embedding_model_name": "@model-configs/bug-bridge-flow_vectorize-node-584_embedding-model-name.ts",
    "bug_bridge_flow_vectorize_node_970_embedding_model_name": "@model-configs/bug-bridge-flow_vectorize-node-970_embedding-model-name.ts",
    "bug_bridge_flow_vectorize_node_926_embedding_model_name": "@model-configs/bug-bridge-flow_vectorize-node-926_embedding-model-name.ts",
    "bug_bridge_flow_vectorize_node_995_embedding_model_name": "@model-configs/bug-bridge-flow_vectorize-node-995_embedding-model-name.ts"
  },
  "scripts": {
    "bug_bridge_flow_code_node_893_code": "@scripts/bug-bridge-flow_code-node-893_code.ts",
    "bug_bridge_flow_code_node_855_code": "@scripts/bug-bridge-flow_code-node-855_code.ts",
    "bug_bridge_flow_code_node_286_code": "@scripts/bug-bridge-flow_code-node-286_code.ts",
    "bug_bridge_flow_code_node_776_code": "@scripts/bug-bridge-flow_code-node-776_code.ts",
    "bug_bridge_flow_code_node_321_code": "@scripts/bug-bridge-flow_code-node-321_code.ts",
    "bug_bridge_flow_code_node_404_code": "@scripts/bug-bridge-flow_code-node-404_code.ts",
    "bug_bridge_flow_code_node_601_code": "@scripts/bug-bridge-flow_code-node-601_code.ts",
    "bug_bridge_flow_code_node_617_code": "@scripts/bug-bridge-flow_code-node-617_code.ts"
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
        "advance_schema": "{\n  \"window_start\": \"string\"\n}"
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{}"
      }
    }
  },
  {
    "id": "apiNode_408",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_408",
        "url": "https://selfemployeed-61989.zendesk.com/api/v2/search.json?query=type:ticket&sort_by=created_at&sort_order=desc",
        "method": "GET",
        "headers": "{\"Content-Type\":\"application/json\",\"Authorization\":\"Basic {{secrets.project.ZENDESK_BASIC_AUTH}}\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_893",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-893_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "batchNode_947",
    "type": "batchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "batchNode",
      "values": {
        "id": "batchNode_947",
        "endValue": 10,
        "nodeName": "Batch",
        "increment": 1,
        "connectedTo": "batchEndNode_721",
        "iterateOver": "list",
        "initialValue": 0,
        "iteratorValue": "{{codeNode_893.output.new_tickets}}",
        "concurrencyLimit": 10
      }
    }
  },
  {
    "id": "variablesNode_734",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "mapping": "{\n  \"search_text\": {\n    \"type\": \"string\",\n    \"value\": \"{{batchNode_947.output.currentValue.description}}\"\n  },\n  \"full_ticket\": {\n    \"type\": \"string\",\n    \"value\": \"{{batchNode_947.output.currentValue}}\"\n  }\n}",
        "nodeName": ""
      }
    }
  },
  {
    "id": "searchNode_833",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "id": "searchNode_833",
        "limit": "3",
        "filters": "[]",
        "nodeName": "Vector Search",
        "vectorDB": "bugbridgeclustersv2",
        "certainty": "0.7",
        "searchQuery": "{{variablesNode_734.output.search_text}}",
        "embeddingModelName": "@model-configs/bug-bridge-flow_search-node-833_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_855",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-855_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "InstructorLLMNode_809",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"decision\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"matched_cluster_id\": {\n      \"type\": \"string\"\n    },\n    \"confidence\": {\n      \"type\": \"number\",\n      \"required\": true\n    },\n    \"evidence\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"statement\": {\n            \"type\": \"string\"\n          },\n          \"source\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/bug-bridge-flow_instructor-llmnode-809_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/bug-bridge-flow_instructor-llmnode-809_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/bug-bridge-flow_instructor-llmnode-809_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_286",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-286_code.ts",
        "nodeName": "Validate JSON"
      }
    }
  },
  {
    "id": "codeNode_776",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-776_code.ts",
        "nodeName": "Deterministic Router"
      }
    }
  },
  {
    "id": "apiNode_806",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_806",
        "url": "https://api.github.com/repos/Kavya100206/bug-bridge-test/issues/{{codeNode_776.output.gh_issue_number}}",
        "body": "",
        "method": "GET",
        "headers": "{\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\",\"Accept\":\"application/vnd.github+json\",\"Content-Type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Check GitHub Issue State",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "conditionNode_648",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Create",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_648-addNode_946",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_776.output.final_route}}\",\n      \"operator\": \"==\",\n      \"value\": \"create\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_648-addNode_603",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "conditionNode_566",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Update",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_566-addNode_784",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_776.output.final_route}}_{{apiNode_806.output.state}}\",\n      \"operator\": \"==\",\n      \"value\": \"update_open\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_566-addNode_789",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "conditionNode_484",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Reopen",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_484-addNode_236",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{apiNode_806.output.state}}\",\n      \"operator\": \"==\",\n      \"value\": \"closed\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_484-addNode_377",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "conditionNode_604",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Index Singleton",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_604-addNode_315",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_776.output.final_route}}\",\n      \"operator\": \"==\",\n      \"value\": \"index_singleton\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_604-addNode_444",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "vectorizeNode_681",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": [
          "{{variablesNode_734.output.full_ticket.description}}"
        ],
        "embeddingModelName": "@model-configs/bug-bridge-flow_vectorize-node-681_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_321",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-321_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorNode_729",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_729",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "bugbridgeclustersv2",
        "primaryKeys": [
          "cluster_id"
        ],
        "vectorsField": "{{codeNode_321.output.vectors}}",
        "metadataField": "{{codeNode_321.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "conditionNode_667",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Update Singleton",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_667-addNode_282",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_776.output.final_route}}\",\n      \"operator\": \"==\",\n      \"value\": \"update_singleton\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_667-addNode_653",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "vectorizeNode_584",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": [
          "{{variablesNode_734.output.full_ticket.description}}"
        ],
        "embeddingModelName": "@model-configs/bug-bridge-flow_vectorize-node-584_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_444",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_444",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "Update Singleton Cluster",
        "vectorDB": "bugbridgeclustersv2",
        "primaryKeys": [
          "cluster_id"
        ],
        "vectorsField": "{{vectorizeNode_584.output.vectors}}",
        "metadataField": "{  \"cluster_id\": \"{{codeNode_776.output.cluster_id}}\",  \"ticket_id\": \"{{variablesNode_734.output.full_ticket.id}}\",  \"subject\": \"{{variablesNode_734.output.full_ticket.subject}}\",  \"github_issue_number\": null,  \"accounts\": \"{{codeNode_776.output.updated_accounts}}\",  \"ticket_ids\": \"{{codeNode_776.output.updated_ticket_ids}}\",  \"severity\": \"{{codeNode_776.output.severity}}\"}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_653682",
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
    "id": "plus-node-addNode_727669",
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
    "id": "plus-node-addNode_924206",
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
    "id": "apiNode_247",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_247",
        "url": "https://api.github.com/repos/Kavya100206/bug-bridge-test/issues/{{codeNode_776.output.gh_issue_number}}",
        "body": "{\n  \"state\": \"open\"\n}",
        "method": "PATCH",
        "headers": "{\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\",\"Accept\":\"application/vnd.github+json\",\"Content-Type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Reopen GitHub Issue",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_404",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-404_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_970",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_970",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_404.output.text}}",
        "embeddingModelName": "@model-configs/bug-bridge-flow_vectorize-node-970_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_423",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_423",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "bugbridgeclustersv2",
        "primaryKeys": [
          "cluster_id"
        ],
        "vectorsField": "{{vectorizeNode_970.output.vectors}}",
        "metadataField": "{{codeNode_404.output.metadata_payload}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_406199",
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
    "id": "codeNode_601",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-601_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_926",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_926",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_601.output.text}}",
        "embeddingModelName": "@model-configs/bug-bridge-flow_vectorize-node-926_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "apiNode_921",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_921",
        "url": "https://api.github.com/repos/Kavya100206/bug-bridge-test/issues/{{codeNode_776.output.gh_issue_number}}",
        "body": "{\n  \"body\": \"{{variablesNode_734.output.full_ticket.description}}\"\n}",
        "method": "PATCH",
        "headers": "{\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\",\"Accept\":\"application/vnd.github+json\",\"Content-Type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Update GitHub Issue",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "vectorNode_219",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_219",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "bugbridgeclustersv2",
        "primaryKeys": [
          "cluster_id"
        ],
        "vectorsField": "{{vectorizeNode_926.output.vectors}}",
        "metadataField": "{{codeNode_601.output.metadata_payload}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_694190",
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
    "id": "apiNode_357",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "url": "https://api.github.com/repos/Kavya100206/bug-bridge-test/issues",
        "body": "{\n  \"title\": \"{{variablesNode_734.output.full_ticket.subject}}\",\n  \"body\": \"{{variablesNode_734.output.full_ticket.description}}\\n\\n<!-- bug-bridge-state: {\\\"cluster_id\\\":\\\"{{codeNode_776.output.cluster_id}}\\\"} -->\",\n  \"labels\": [\n    \"bbc:{{codeNode_776.output.cluster_id}}\",\n    \"{{codeNode_776.output.severity}}\"\n  ]\n}",
        "method": "POST",
        "headers": "{\"Authorization\":\"Bearer {{secrets.project.GITHUB_TOKEN}}\", \"Accept\":\"application/vnd.github+json\",\"Content-Type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "github create issue",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_617",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-flow_code-node-617_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_995",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_995",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_617.output.text}}",
        "embeddingModelName": "@model-configs/bug-bridge-flow_vectorize-node-995_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_867",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_867",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "bugbridgeclustersv2",
        "primaryKeys": [
          "cluster_id"
        ],
        "vectorsField": "{{vectorizeNode_995.output.vectors}}",
        "metadataField": "{{codeNode_617.output.metadata_payload}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "batchEndNode_721",
    "type": "batchEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "batchEndNode",
      "values": {
        "nodeName": "Batch End",
        "connectedTo": "batchNode_947"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-apiNode_408",
    "source": "triggerNode_1",
    "target": "apiNode_408",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_408-codeNode_893",
    "source": "apiNode_408",
    "target": "codeNode_893",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_893-batchNode_947",
    "source": "codeNode_893",
    "target": "batchNode_947",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "batchNode_947-variablesNode_734",
    "source": "batchNode_947",
    "target": "variablesNode_734",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "variablesNode_734-searchNode_833",
    "source": "variablesNode_734",
    "target": "searchNode_833",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_648-apiNode_357",
    "source": "conditionNode_648",
    "target": "apiNode_357",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_648-conditionNode_566",
    "source": "conditionNode_648",
    "target": "conditionNode_566",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_566-conditionNode_484",
    "source": "conditionNode_566",
    "target": "conditionNode_484",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_855-InstructorLLMNode_809",
    "source": "codeNode_855",
    "target": "InstructorLLMNode_809",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_484-apiNode_247",
    "source": "conditionNode_484",
    "target": "apiNode_247",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_286-codeNode_776",
    "source": "codeNode_286",
    "target": "codeNode_776",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_776-apiNode_806",
    "source": "codeNode_776",
    "target": "apiNode_806",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_806-conditionNode_648",
    "source": "apiNode_806",
    "target": "conditionNode_648",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_484-conditionNode_604",
    "source": "conditionNode_484",
    "target": "conditionNode_604",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_604-vectorizeNode_681",
    "source": "conditionNode_604",
    "target": "vectorizeNode_681",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_604-conditionNode_667",
    "source": "conditionNode_604",
    "target": "conditionNode_667",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_566-codeNode_601",
    "source": "conditionNode_566",
    "target": "codeNode_601",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_667-plus-node-addNode_653682",
    "source": "conditionNode_667",
    "target": "plus-node-addNode_653682",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_667-vectorizeNode_584",
    "source": "conditionNode_667",
    "target": "vectorizeNode_584",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "vectorizeNode_584-vectorNode_444",
    "source": "vectorizeNode_584",
    "target": "vectorNode_444",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_653682-plus-node-addNode_727669",
    "source": "plus-node-addNode_653682",
    "target": "plus-node-addNode_727669",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_444-plus-node-addNode_727669",
    "source": "vectorNode_444",
    "target": "plus-node-addNode_727669",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_729-plus-node-addNode_924206",
    "source": "vectorNode_729",
    "target": "plus-node-addNode_924206",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_727669-plus-node-addNode_924206",
    "source": "plus-node-addNode_727669",
    "target": "plus-node-addNode_924206",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_924206-plus-node-addNode_406199",
    "source": "plus-node-addNode_924206",
    "target": "plus-node-addNode_406199",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_406199-plus-node-addNode_694190",
    "source": "plus-node-addNode_406199",
    "target": "plus-node-addNode_694190",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_681-codeNode_321",
    "source": "vectorizeNode_681",
    "target": "codeNode_321",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_321-vectorNode_729",
    "source": "codeNode_321",
    "target": "vectorNode_729",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_833-codeNode_855",
    "source": "searchNode_833",
    "target": "codeNode_855",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_357-codeNode_617",
    "source": "apiNode_357",
    "target": "codeNode_617",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_617-vectorizeNode_995",
    "source": "codeNode_617",
    "target": "vectorizeNode_995",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_995-vectorNode_867",
    "source": "vectorizeNode_995",
    "target": "vectorNode_867",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_867-batchEndNode_721",
    "source": "vectorNode_867",
    "target": "batchEndNode_721",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_809-codeNode_286",
    "source": "InstructorLLMNode_809",
    "target": "codeNode_286",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_921-vectorNode_219",
    "source": "apiNode_921",
    "target": "vectorNode_219",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_219-plus-node-addNode_694190",
    "source": "vectorNode_219",
    "target": "plus-node-addNode_694190",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_601-vectorizeNode_926",
    "source": "codeNode_601",
    "target": "vectorizeNode_926",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_926-apiNode_921",
    "source": "vectorizeNode_926",
    "target": "apiNode_921",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_247-codeNode_404",
    "source": "apiNode_247",
    "target": "codeNode_404",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_404-vectorizeNode_970",
    "source": "codeNode_404",
    "target": "vectorizeNode_970",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_970-vectorNode_423",
    "source": "vectorizeNode_970",
    "target": "vectorNode_423",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_423-plus-node-addNode_406199",
    "source": "vectorNode_423",
    "target": "plus-node-addNode_406199",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_694190-batchEndNode_721",
    "source": "plus-node-addNode_694190",
    "target": "batchEndNode_721",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "batchEndNode_721-batchNode_947",
    "source": "batchEndNode_721",
    "target": "batchNode_947",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
  },
  {
    "id": "batchEndNode_721-batchNode_947",
    "source": "batchEndNode_721",
    "target": "batchNode_947",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "loopEdge"
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

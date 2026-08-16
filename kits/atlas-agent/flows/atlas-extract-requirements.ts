// Flow: atlas-extract-requirements

// -- Meta --
export const meta = {
  "name": "Atlas - Extract Requirements",
  "description": "Extracts source-grounded requirements from an untrusted project document.",
  "tags": [
    "requirements",
    "traceability"
  ],
  "testInput": {
    "documentName": "Demo PRD",
    "documentText": "# Authentication\nUsers must be able to reset a forgotten password."
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "modelType": "generator/text",
      "description": "Model used for structured requirement extraction.",
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

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "system": "@prompts/atlas-extract-requirements_extract_system.md",
    "user": "@prompts/atlas-extract-requirements_extract_user.md"
  },
  "modelConfigs": {
    "extract": "@model-configs/atlas-extract-requirements_extract.ts"
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
        "advance_schema": "{\n  \"documentName\": \"string\",\n  \"documentText\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_1",
        "nodeName": "Extract Requirements",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"requirements\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\"type\": \"string\"},\n          \"title\": {\"type\": \"string\"},\n          \"description\": {\"type\": \"string\"},\n          \"priority\": {\"type\": \"string\"},\n          \"headingPath\": {\"type\": \"string\"},\n          \"sourceExcerpt\": {\"type\": \"string\"},\n          \"confidence\": {\"type\": \"number\"}\n        },\n        \"required\": [\"id\", \"title\", \"description\", \"sourceExcerpt\", \"confidence\"]\n      }\n    }\n  },\n  \"required\": [\"requirements\"]\n}",
        "prompts": [
          {
            "id": "extract-system",
            "role": "system",
            "content": "@prompts/atlas-extract-requirements_extract_system.md"
          },
          {
            "id": "extract-user",
            "role": "user",
            "content": "@prompts/atlas-extract-requirements_extract_user.md"
          }
        ],
        "memories": "@model-configs/atlas-extract-requirements_extract.ts",
        "messages": "@model-configs/atlas-extract-requirements_extract.ts",
        "attachments": "@model-configs/atlas-extract-requirements_extract.ts",
        "generativeModelName": "@model-configs/atlas-extract-requirements_extract.ts"
      }
    }
  },
  {
    "id": "responseNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 300
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "isResponseNode": true,
      "values": {
        "id": "responseNode_1",
        "nodeName": "API Response",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "retry_delay": "0",
        "needs": [
          "InstructorLLMNode_1"
        ],
        "outputMapping": "{\n  \"requirements\": \"{{InstructorLLMNode_1.output.requirements}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-extract",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extract-response",
    "source": "InstructorLLMNode_1",
    "target": "responseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-edge",
    "source": "triggerNode_1",
    "target": "responseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

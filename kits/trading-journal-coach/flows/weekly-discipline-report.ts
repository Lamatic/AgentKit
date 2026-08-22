// Flow: weekly-discipline-report

// -- Meta --
export const meta = {
  "name": "weekly-discipline-report",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "VAIBHAV YADAV",
    "email": "vaibhavyadav.977@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_679": [
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
    "weekly_discipline_report_llmnode_679_system_0": "@prompts/weekly-discipline-report_llmnode-679_system_0.md",
    "weekly_discipline_report_llmnode_679_user_1": "@prompts/weekly-discipline-report_llmnode-679_user_1.md"
  },
  "modelConfigs": {
    "weekly_discipline_report_llmnode_679_generative_model_name": "@model-configs/weekly-discipline-report_llmnode-679_generative-model-name.ts"
  },
  "scripts": {
    "weekly_discipline_report_code_node_204_code": "@scripts/weekly-discipline-report_code-node-204_code.ts"
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
      "nodeId": "cronNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "Cron",
        "cronTimezone": "UTC",
        "cronExpression": "15 8 * * 1"
      }
    }
  },
  {
    "id": "codeNode_204",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/weekly-discipline-report_code-node-204_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "LLMNode_679",
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
            "content": "@prompts/weekly-discipline-report_llmnode-679_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/weekly-discipline-report_llmnode-679_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/weekly-discipline-report_llmnode-679_generative-model-name.ts"
      }
    }
  },
  {
    "id": "plus-node-addNode_377339",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_204-194",
    "source": "triggerNode_1",
    "target": "codeNode_204",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_204-LLMNode_679-295",
    "source": "codeNode_204",
    "target": "LLMNode_679",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_679-plus-node-addNode_377339-631",
    "source": "LLMNode_679",
    "target": "plus-node-addNode_377339",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

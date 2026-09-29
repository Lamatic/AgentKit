// Flow: run-execute-pipeline

// -- Meta --
export const meta = {
  "name": "run-execute-pipeline",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Vishwa Nanavati",
    "email": "vpnanavati@gmail.com"
  }
};

// -- Inputs --
export const inputs = {};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "run_execute_pipeline_code_node_525_code": "@scripts/run-execute-pipeline_code-node-525_code.ts",
    "run_execute_pipeline_code_node_821_code": "@scripts/run-execute-pipeline_code-node-821_code.ts"
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
        "nodeName": "Cron",
        "cronExpression": "30 */4 * * *",
        "cronTimezone": "Asia/Calcutta",
        "id": "triggerNode_1"
      }
    }
  },
  {
    "id": "flowNode_522",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "flowNode",
      "values": {
        "id": "flowNode_522",
        "flowId": "5f102347-0241-4509-818e-8a7fb9ad77e0",
        "nodeName": "Execute collect-sources",
        "requestInput": "{\"sampleInput\":\"\"}"
      }
    }
  },
  {
    "id": "flowNode_322",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "flowNode",
      "values": {
        "id": "flowNode_322",
        "flowId": "58bbe3ec-1703-4580-8486-cc5cb4329654",
        "nodeName": "Execute curate-pick",
        "requestInput": "{\n  \"geminiResponse\": \"{{flowNode_522.output.flowOutput}}.geminiResponse\",\n  \"otherSources\": \"{{flowNode_522.output.flowOutput}}.otherSources\",\n  \"collectedAt\": \"{{flowNode_522.output.flowOutput}}.collectedAt\"\n}"
      }
    }
  },
  {
    "id": "branchNode_476",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_476-addNode_864"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_476-addNode_153"
          }
        ],
        "nodeName": "Branching"
      }
    }
  },
  {
    "id": "flowNode_367",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "flowNode",
      "values": {
        "id": "flowNode_367",
        "flowId": "2c196c26-1961-466c-90a1-3d1cf2445efc",
        "nodeName": "Execute visual-planner",
        "requestInput": "{\n  \"topPick\": \"{{flowNode_322.output.flowOutput}}.topPick\",\n  \"runnerUp\": \"{{flowNode_322.output.flowOutput}}.runnerUp\",\n  \"rankedList\": \"{{flowNode_322.output.flowOutput}}.rankedList\",\n  \"finalRecommendation\": \"{{flowNode_322.output.flowOutput}}.finalRecommendation\",\n  \"digestId\": \"{{flowNode_322.output.flowOutput}}.digestId\",\n  \"collectedAt\": \"{{flowNode_322.output.flowOutput}}.collectedAt\"\n}"
      }
    }
  },
  {
    "id": "flowNode_177",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "flowNode",
      "values": {
        "id": "flowNode_177",
        "flowId": "e52d58df-131e-4393-82a2-0dfbfe4ca29d",
        "nodeName": "Execute draft-content",
        "requestInput": "{\n  \"topPick\": \"{{flowNode_322.output.flowOutput}}.topPick\",\n  \"runnerUp\": \"{{flowNode_322.output.flowOutput}}.runnerUp\",\n  \"rankedList\": \"{{flowNode_322.output.flowOutput}}.rankedList\",\n  \"finalRecommendation\": \"{{flowNode_322.output.flowOutput}}.finalRecommendation\",\n  \"digestId\": \"{{flowNode_322.output.flowOutput}}.digestId\",\n  \"skipReason\": \"{{flowNode_322.output.flowOutput}}.skipReason\",\n  \"collectedAt\": \"{{flowNode_322.output.flowOutput}}.collectedAt\"\n}"
      }
    }
  },
  {
    "id": "codeNode_525",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/run-execute-pipeline_code-node-525_code.ts",
        "nodeName": "SKIP"
      }
    }
  },
  {
    "id": "codeNode_821",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/run-execute-pipeline_code-node-821_code.ts",
        "nodeName": "MERGE"
      }
    }
  },
  {
    "id": "plus-node-addNode_triggerNode_1713",
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
    "id": "triggerNode_1-flowNode_522",
    "source": "triggerNode_1",
    "target": "flowNode_522",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "flowNode_322-branchNode_476",
    "source": "flowNode_322",
    "target": "branchNode_476",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "branchNode_476-flowNode_177-375",
    "source": "branchNode_476",
    "target": "flowNode_177",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "flowNode_177-codeNode_525-697",
    "source": "flowNode_177",
    "target": "codeNode_525",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "branchNode_476-flowNode_367-642",
    "source": "branchNode_476",
    "target": "flowNode_367",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "branchEdge"
  },
  {
    "id": "flowNode_367-codeNode_525-152",
    "source": "flowNode_367",
    "target": "codeNode_525",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_525-codeNode_821",
    "source": "codeNode_525",
    "target": "codeNode_821",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "flowNode_522-flowNode_322-216",
    "source": "flowNode_522",
    "target": "flowNode_322",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_821-plus-node-addNode_triggerNode_1713",
    "source": "codeNode_821",
    "target": "plus-node-addNode_triggerNode_1713",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

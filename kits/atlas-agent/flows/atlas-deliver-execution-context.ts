// Flow: atlas-deliver-execution-context

// -- Meta --
export const meta = {
  "name": "Atlas - Deliver Execution Context",
  "description": "Assembles only the approved task's linked requirements and documents for authorized delivery.",
  "tags": [
    "context",
    "execution"
  ],
  "testInput": {
    "approvedTask": {
      "id": "TASK-1",
      "title": "Implement password reset",
      "requirementIds": [
        "REQ-001"
      ]
    },
    "requirements": [
      {
        "id": "REQ-001",
        "description": "Users must reset forgotten passwords.",
        "documentId": "DOC-1"
      }
    ],
    "documents": [
      {
        "id": "DOC-1",
        "name": "Demo PRD",
        "url": "https://example.test/demo-prd"
      }
    ]
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
    "assemble": "@scripts/atlas-deliver-execution-context_assemble.ts"
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
        "advance_schema": "{\n  \"approvedTask\": \"object\",\n  \"requirements\": \"array\",\n  \"documents\": \"array\"\n}"
      }
    }
  },
  {
    "id": "codeNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_1",
        "nodeName": "Assemble Linked Execution Context",
        "code": "@scripts/atlas-deliver-execution-context_assemble.ts"
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
          "codeNode_1"
        ],
        "outputMapping": "{\n  \"executionContext\": \"{{codeNode_1.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-assemble",
    "source": "triggerNode_1",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "assemble-response",
    "source": "codeNode_1",
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

// Flow: subsniffer
// Audit a bank statement for recurring subscriptions, flag unused ones,
// estimate savings, and surface cancellation links. Single Lamatic flow:
// API Request -> InstructorLLM (Detect Subscriptions) -> LLM (Write Report)
// -> API Response returning { analysis, report }.

// -- Meta --
export const meta = {
  "name": "SubSniffer — Subscription Audit",
  "description": "Audit a bank statement for recurring subscriptions, flag unused ones, estimate savings, and surface cancellation links.",
  "tags": ["finance", "subscriptions", "savings"],
  "testInput": "{\"statement\":\"NETFLIX $15.49; SPOTIFY $10.99; ADOBE CREATIVE $59.99 (used once 4 months ago); GYMPASS $40 (never used); AMAZON PRIME $14.99; DROPBOX $11.99 (used weekly); NOTION $8 (used daily); ONE-OFF COFFEE $4.50\",\"goals\":\"cancel anything I have not used in 60 days\"}",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Satyam Singh",
    "email": "satyamsingh7734@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_954": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_456": [
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
    "subsniffer_instructor_llmnode_954_system_0": "@prompts/subsniffer_detect-subscriptions_system.md",
    "subsniffer_instructor_llmnode_954_user_1": "@prompts/subsniffer_detect-subscriptions_user.md",
    "subsniffer_llmnode_456_system_0": "@prompts/subsniffer_write-report_system.md",
    "subsniffer_llmnode_456_user_1": "@prompts/subsniffer_write-report_user.md"
  },
  "modelConfigs": {
    "subsniffer_instructor_llmnode_954_generative_model_name": "@model-configs/subsniffer_detect-subscriptions.ts",
    "subsniffer_llmnode_456_generative_model_name": "@model-configs/subsniffer_write-report.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "InstructorLLMNode_954",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "schema": "{\"type\":\"object\",\"properties\":{\"summary\":{\"type\":\"string\"},\"subscriptions\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"merchant\":{\"type\":\"string\"},\"amount\":{\"type\":\"number\"},\"cadence\":{\"type\":\"string\"},\"category\":{\"type\":\"string\"},\"usage\":{\"type\":\"string\"},\"reason\":{\"type\":\"string\"},\"monthly_cost\":{\"type\":\"number\"},\"cancellation_url\":{\"type\":\"string\"}},\"required\":[\"merchant\",\"amount\",\"cadence\",\"category\",\"usage\",\"monthly_cost\"]}},\"totals\":{\"type\":\"object\",\"properties\":{\"monthly_recurring\":{\"type\":\"number\"},\"annual_recurring\":{\"type\":\"number\"},\"estimated_savings\":{\"type\":\"number\"}}},\"top_recommendations\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"risk_flags\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"required\":[\"summary\",\"subscriptions\",\"totals\"]}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/subsniffer_detect-subscriptions_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/subsniffer_detect-subscriptions_user.md"
          }
        ],
        "nodeName": "Detect Subscriptions",
        "generativeModelName": "@model-configs/subsniffer_detect-subscriptions.ts"
      }
    }
  },
  {
    "id": "LLMNode_456",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7c",
            "role": "system",
            "content": "@prompts/subsniffer_write-report_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7e",
            "role": "user",
            "content": "@prompts/subsniffer_write-report_user.md"
          }
        ],
        "nodeName": "Write Report",
        "generativeModelName": "@model-configs/subsniffer_write-report.ts"
      }
    }
  },
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"statement\": \"string\",\n  \"goals\": \"string\"\n}"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\"analysis\":\"{{InstructorLLMNode_954.output}}\",\"report\":\"{{LLMNode_456.output.generatedResponse}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_954",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_954",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_954-LLMNode_456",
    "source": "InstructorLLMNode_954",
    "target": "LLMNode_456",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_456-responseNode_triggerNode_1",
    "source": "LLMNode_456",
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

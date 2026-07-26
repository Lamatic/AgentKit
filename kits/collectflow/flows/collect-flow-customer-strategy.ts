// Flow: collect-flow-customer-strategy

// -- Meta --
export const meta = {
  "name": "CollectFlow Customer Strategy",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sahil Shitole",
    "email": "sahilmshitole1483@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_730": [
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
    "collect_flow_customer_strategy_instructor_llmnode_730_system_0": "@prompts/collect-flow-customer-strategy_instructor-llmnode-730_system_0.md",
    "collect_flow_customer_strategy_instructor_llmnode_730_user_1": "@prompts/collect-flow-customer-strategy_instructor-llmnode-730_user_1.md"
  },
  "modelConfigs": {
    "collect_flow_customer_strategy_instructor_llmnode_730_generative_model_name": "@model-configs/collect-flow-customer-strategy_instructor-llmnode-730_generative-model-name.ts"
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
        "advance_schema": "{\n  \"customer_data\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_730",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"next_best_action\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"action_summary\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"reasoning\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"recommended_channel\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"confidence\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"approval_required\": {\n      \"type\": \"boolean\",\n      \"required\": true\n    },\n    \"approval_reason\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"operational_controls\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"draft_subject\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"draft_message\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"journey_state\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"next_follow_up_days\": {\n      \"type\": \"number\",\n      \"required\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/collect-flow-customer-strategy_instructor-llmnode-730_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/collect-flow-customer-strategy_instructor-llmnode-730_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Customer Strategy Agent",
        "attachments": "",
        "generativeModelName": "@model-configs/collect-flow-customer-strategy_instructor-llmnode-730_generative-model-name.ts"
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
        "outputMapping": "{\n  \"next_best_action\": \"{{InstructorLLMNode_730.output.next_best_action}}\",\n  \"action_summary\": \"{{InstructorLLMNode_730.output.action_summary}}\",\n  \"reasoning\": \"{{InstructorLLMNode_730.output.reasoning}}\",\n  \"recommended_channel\": \"{{InstructorLLMNode_730.output.recommended_channel}}\",\n  \"confidence\": \"{{InstructorLLMNode_730.output.confidence}}\",\n  \"approval_required\": \"{{InstructorLLMNode_730.output.approval_required}}\",\n  \"approval_reason\": \"{{InstructorLLMNode_730.output.approval_reason}}\",\n  \"operational_controls\": \"{{InstructorLLMNode_730.output.operational_controls}}\",\n  \"draft_subject\": \"{{InstructorLLMNode_730.output.draft_subject}}\",\n  \"draft_message\": \"{{InstructorLLMNode_730.output.draft_message}}\",\n  \"journey_state\": \"{{InstructorLLMNode_730.output.journey_state}}\",\n  \"next_follow_up_days\": \"{{InstructorLLMNode_730.output.next_follow_up_days}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_730",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_730",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_730-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_730",
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

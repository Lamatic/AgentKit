/**
 * ============================================================================
 * FLOW 02: INCIDENT ALERT GENERATOR (THE CHAOS MONKEY)
 * ============================================================================
 * 
 * Architecture Overview:
 * Transforms natural language SRE outage descriptions or preset scenario prompts
 * into structured Datadog / PagerDuty JSON telemetry alerts.
 *
 * Pipeline Lifecycle:
 * 1. triggerNode_1: Real-time GraphQL endpoint receiving `{ "prompt": string }`.
 * 2. LLMNode_1: Executes structured generative AI prompt with domain instructions
 *    to synthesize realistic error rates, affected endpoints, severity classification
 *    (P1-P4), and root cause hints.
 * 3. responseNode_triggerNode_1: Returns formatted JSON alert payload for simulation.
 * ============================================================================
 */

// Flow: flow-2-incident-generator-the-chaos-monkey

// -- Meta --
export const meta = {
  "name": "Flow 2 Incident Generator The Chaos Monkey",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Nikhil Rajput",
    "email": "rajputnik911@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_1": [
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
    "flow_2_incident_generator_the_chaos_monkey_llmnode_1_system_0": "@prompts/flow-2-incident-generator-the-chaos-monkey_llmnode-1_system_0.md",
    "flow_2_incident_generator_the_chaos_monkey_llmnode_1_user_1": "@prompts/flow-2-incident-generator-the-chaos-monkey_llmnode-1_user_1.md"
  },
  "modelConfigs": {
    "flow_2_incident_generator_the_chaos_monkey_llmnode_1_generative_model_name": "@model-configs/flow-2-incident-generator-the-chaos-monkey_llmnode-1_generative-model-name.ts"
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
        "nodeName": "Incident Generator API",
        "responeType": "realtime",
        "advance_schema": "{\n  \"prompt\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "tools": [],
        "prompts": [
          {
            "id": "96dbb1e1-6bd2-4a7a-a242-4b6aa9983edb",
            "role": "system",
            "content": "@prompts/flow-2-incident-generator-the-chaos-monkey_llmnode-1_system_0.md"
          },
          {
            "id": "d18e616e-ae8a-4fd7-9b73-474607fd76fd",
            "role": "user",
            "content": "@prompts/flow-2-incident-generator-the-chaos-monkey_llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Incident Alert",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flow-2-incident-generator-the-chaos-monkey_llmnode-1_generative-model-name.ts"
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
        "headers": "{\"content-type\": \"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"alert\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-responseNode_triggerNode_1",
    "source": "LLMNode_1",
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

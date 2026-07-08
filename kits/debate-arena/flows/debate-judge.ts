// Flow: debate-judge

// -- Meta --
export const meta = {
  "name": "debate-judge",
  "description": "Reviews the full debate transcript and synthesizes a pros/cons matrix, strongest arguments, and a final recommendation.",
  "tags": ["generative", "multi-agent", "decision-making"],
  "testInput": {
    "topic": "Should social media platforms be legally required to verify user identities?",
    "positionA": { "label": "Pro-Verification", "stance": "Mandatory identity verification reduces harassment, bots, and disinformation, improving platform accountability." },
    "positionB": { "label": "Anti-Verification", "stance": "Mandatory verification threatens privacy, anonymity for vulnerable users, and free expression." },
    "transcript": [
      { "round": 1, "side": "A", "label": "Pro-Verification", "statement": "Verification cuts down bot networks and coordinated disinformation campaigns significantly.", "keyPoint": "Reduces bots and disinformation" },
      { "round": 1, "side": "B", "label": "Anti-Verification", "statement": "Requiring ID exposes dissidents, whistleblowers, and abuse survivors to real-world retaliation.", "keyPoint": "Endangers vulnerable users" }
    ]
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "HEMANTH AMARTHI",
    "email": "hemanthkumar.amarthi7@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_239": [
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
    "debate_judge_instructorllmnode_239_system_0": "@prompts/debate-judge_instructorllmnode-239_system_0.md",
    "debate_judge_instructorllmnode_239_user_1": "@prompts/debate-judge_instructorllmnode-239_user_1.md"
  },
  "modelConfigs": {
    "debate_judge_instructorllmnode_239_generative_model_name": "@model-configs/debate-judge_instructorllmnode-239_generative-model-name.ts"
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
        "advance_schema": "{\n  \"topic\": \"string\",\n  \"positionA\": {\n    \"label\": \"string\",\n    \"stance\": \"string\"\n  },\n  \"positionB\": {\n    \"label\": \"string\",\n    \"stance\": \"string\"\n  },\n  \"transcript\": [\n    {\n      \"round\": \"int\",\n      \"side\": \"string\",\n      \"label\": \"string\",\n      \"statement\": \"string\",\n      \"keyPoint\": \"string\"\n    }\n  ]\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_239",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_239",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"prosA\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"consA\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"prosB\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"consB\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"strongestArgA\": {\n      \"type\": \"string\"\n    },\n    \"strongestArgB\": {\n      \"type\": \"string\"\n    },\n    \"recommendation\": {\n      \"type\": \"string\"\n    },\n    \"confidence\": {\n      \"type\": \"string\"\n    },\n    \"caveats\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "e4b7e4e6-cc60-4b0e-96ba-4ecb049d268b",
            "role": "system",
            "content": "@prompts/debate-judge_instructorllmnode-239_system_0.md"
          },
          {
            "id": "de3ce2bf-0aa0-4569-a187-696487d67631",
            "role": "user",
            "content": "@prompts/debate-judge_instructorllmnode-239_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/debate-judge_instructorllmnode-239_generative-model-name.ts"
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
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"prosA\": \"{{InstructorLLMNode_239.output.prosA}}\",\n  \"consA\": \"{{InstructorLLMNode_239.output.consA}}\",\n  \"prosB\": \"{{InstructorLLMNode_239.output.prosB}}\",\n  \"consB\": \"{{InstructorLLMNode_239.output.consB}}\",\n  \"strongestArgA\": \"{{InstructorLLMNode_239.output.strongestArgA}}\",\n  \"strongestArgB\": \"{{InstructorLLMNode_239.output.strongestArgB}}\",\n  \"recommendation\": \"{{InstructorLLMNode_239.output.recommendation}}\",\n  \"confidence\": \"{{InstructorLLMNode_239.output.confidence}}\",\n  \"caveats\": \"{{InstructorLLMNode_239.output.caveats}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_239",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_239",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_239-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_239",
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

export const meta = {
  name: "LLM-Response-QA",
  description:
    "Evaluates AI-generated responses for accuracy, completeness, relevance, hallucination risk, and quality.",
  tags: [
    "ai",
    "llm",
    "qa",
    "evaluation",
    "generative-ai"
  ],
  testInput: {
    prompt: "Explain photosynthesis.",
    response: "Plants convert sunlight into energy."
  },
  githubUrl:
    "https://github.com/Ramyatha24/AgentKit/tree/main/kits/llm-response-qa",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Ramyatha Balaraju",
    email: "ramyathaaa@gmail.com"
  }
};


export const inputs = {
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "required": true
    }
  ]
};


export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "system": "@prompts/system.md"
  },
  "modelConfigs": {
    "default": "@model-configs/default.ts"
  }
};


export const nodes = [
  {
    id: "triggerNode_1",
    data: {
      nodeId: "graphqlNode",
      values: {
        id: "triggerNode_1",
        nodeName: "API Request"
      },
      trigger: true
    },
    type: "triggerNode",
    position: {
      x: 0,
      y: 0
    }
  },

  {
    id: "LLMNode_1",
    data: {
      label: "Response Evaluator",
      nodeId: "LLMNode",
      values: {
        nodeName: "Response Evaluator",
        prompts: [
          {
            role: "system",
            content:
              "Evaluate the response for accuracy, completeness, relevance, and hallucination risk."
          }
        ],
        generativeModelName:
          "@model-configs/default.ts"
      }
    },
    type: "dynamicNode",
    position: {
      x: 0,
      y: 150
    }
  },

  {
    id: "responseNode_triggerNode_1",
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        nodeName: "API Response",
        outputMapping:
          "{\n  \"answer\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    },
    type: "responseNode",
    position: {
      x: 0,
      y: 300
    }
  }
];


export const edges = [
  {
    id: "triggerNode_1-LLMNode_1",
    type: "defaultEdge",
    source: "triggerNode_1",
    target: "LLMNode_1"
  },
  {
    id: "LLMNode_1-responseNode_triggerNode_1",
    type: "defaultEdge",
    source: "LLMNode_1",
    target: "responseNode_triggerNode_1"
  }
];


export default {
  meta,
  inputs,
  references,
  nodes,
  edges
};
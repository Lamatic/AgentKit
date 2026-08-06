// Flow: gmap-review-ai

// -- Meta --
export const meta = {
  "name": "GMapReviewAI",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "chandravijay Rai",
    "email": "chandravijayk42187@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_540": [
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
    "gmap_review_ai_llmnode_540_system_0": "@prompts/gmap-review-ai_llmnode-540_system_0.md",
    "gmap_review_ai_llmnode_540_user_1": "@prompts/gmap-review-ai_llmnode-540_user_1.md"
  },
  "modelConfigs": {
    "gmap_review_ai_llmnode_540_generative_model_name": "@model-configs/gmap-review-ai_llmnode-540_generative-model-name.ts"
  },
  "scripts": {
    "gmap_review_ai_code_node_310_code": "@scripts/gmap-review-ai_code-node-310_code.ts"
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
        "advance_schema": "{\n  \"business_name\": \"string\",\n  \"business_maps_url\": \"string\",\n  \"competitor_maps_urls\": \"[string]\",\n  \"max_reviews_per_place\": \"int\",\n  \"reviews_since\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_310",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_310",
        "code": "@scripts/gmap-review-ai_code-node-310_code.ts",
        "nodeName": "Fetch Reviews (Apify)"
      }
    }
  },
  {
    "id": "LLMNode_540",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_540",
        "prompts": [
          {
            "id": "f2ca738a-1f21-4f64-8479-7d2350ee6191",
            "role": "system",
            "content": "@prompts/gmap-review-ai_llmnode-540_system_0.md"
          },
          {
            "id": "085b0de1-a264-4155-856f-937121916c2f",
            "role": "user",
            "content": "@prompts/gmap-review-ai_llmnode-540_user_1.md"
          }
        ],
        "nodeName": "Generate Reputation Pulse",
        "generativeModelName": "@model-configs/gmap-review-ai_llmnode-540_generative-model-name.ts"
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
        "nodeName": "API Response",
        "outputMapping": "{\n  \"report\": \"{{LLMNode_540.output.generatedResponse}}\",\n  \"business_average_rating\": \"{{codeNode_310.output.businessReviewData.sampleAverageRating}}\",\n  \"business_total_reviews_fetched\": \"{{codeNode_310.output.businessReviewData.reviewsFetchedInThisRun}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_310",
    "source": "triggerNode_1",
    "target": "codeNode_310",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_310-LLMNode_540",
    "source": "codeNode_310",
    "target": "LLMNode_540",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_540-responseNode_triggerNode_1",
    "source": "LLMNode_540",
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

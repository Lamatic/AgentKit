// Flow: menu-scan

// -- Meta --
export const meta = {
  "name": "Menu-Scan",
  "description": "Reads a photograph of a restaurant menu and returns every dish as structured JSON: the name as printed, a transliteration and translation, a plain description, an inferred ingredient list, the printed price with its currency, a category, and a confidence rating for how legibly the line was read. The flow reads and reports only — it does not decide what is safe to eat or what to order. Those decisions are made downstream by deterministic, unit-tested code in the Orderly kit, which maps ingredients to the EU-14 major allergens, applies dietary rules, and solves for an order within the diner's budget. Illegible lines are returned with confidence \"unknown\" rather than reconstructed, and prices that cannot be read are left empty rather than guessed.",
  "tags": [
    "🖼️ Multimodal",
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/orderly",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "laxmikhengare",
    "email": "laxmikhengare1611@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_342": [
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
    "menu_scan_multi_modal_llmnode_968_system_0": "@prompts/menu-scan_multi-modal-llmnode-968_system_0.md",
    "menu_scan_multi_modal_llmnode_968_user_1": "@prompts/menu-scan_multi-modal-llmnode-968_user_1.md",
    "menu_scan_instructor_llmnode_342_system_0": "@prompts/menu-scan_instructor-llmnode-342_system_0.md",
    "menu_scan_instructor_llmnode_342_user_1": "@prompts/menu-scan_instructor-llmnode-342_user_1.md"
  },
  "modelConfigs": {
    "menu_scan_multi_modal_llmnode_968_generative_model_name": "@model-configs/menu-scan_multi-modal-llmnode-968_generative-model-name.ts",
    "menu_scan_instructor_llmnode_342_generative_model_name": "@model-configs/menu-scan_instructor-llmnode-342_generative-model-name.ts"
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
        "advance_schema": "{\n  \"menuImage\": \"string\",\n  \"targetLanguage\": \"string\",\n  \"sourceLanguageHint\": \"string\"\n}"
      }
    }
  },
  {
    "id": "multiModalLLMNode_968",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "multiModalLLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/menu-scan_multi-modal-llmnode-968_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/menu-scan_multi-modal-llmnode-968_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Multi Modal",
        "attachments": "{{triggerNode_1.output.menuImage}}",
        "generativeModelName": "@model-configs/menu-scan_multi-modal-llmnode-968_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_342",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"detectedLanguage\": {\n      \"type\": \"string\"\n    },\n    \"currency\": {\n      \"type\": \"string\"\n    },\n    \"notes\": {\n      \"type\": \"string\"\n    },\n    \"dishes\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"nameOriginal\": {\n            \"type\": \"string\"\n          },\n          \"nameTransliterated\": {\n            \"type\": \"string\"\n          },\n          \"nameTranslated\": {\n            \"type\": \"string\"\n          },\n          \"description\": {\n            \"type\": \"string\"\n          },\n          \"likelyIngredients\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"priceRaw\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/menu-scan_instructor-llmnode-342_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/menu-scan_instructor-llmnode-342_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/menu-scan_instructor-llmnode-342_generative-model-name.ts"
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
        "outputMapping": "{\n  \"dishes\": \"{{InstructorLLMNode_342.output.dishes}}\",\n  \"detectedLanguage\": \"{{InstructorLLMNode_342.output.detectedLanguage}}\",\n  \"currency\": \"{{InstructorLLMNode_342.output.currency}}\",\n  \"notes\": \"{{InstructorLLMNode_342.output.notes}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-multiModalLLMNode_968",
    "source": "triggerNode_1",
    "target": "multiModalLLMNode_968",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "multiModalLLMNode_968-InstructorLLMNode_342",
    "source": "multiModalLLMNode_968",
    "target": "InstructorLLMNode_342",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_342-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_342",
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

// Flow: poster-generator

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Poster Generation",
  "description": "poster-generator is a Next.js app + Lamatic flow that turns a natural-language idea into a finished poster HTML file, then lets you preview and export it as HTML, PNG, JPG, or SVG.",
  "tags": "",
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://agent-kit-pg.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_371": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "InstructorLLMNode_121": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "InstructorLLMNode_513": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "intent_parser_system": "@prompts/intent-parser-system.md",
    "design_spec_builder_system": "@prompts/design-spec-builder-system.md",
    "poster_code_generation_system": "@prompts/poster-code-generation-system.md",
    "poster_generator_intent_parser_user": "@prompts/poster-generator_intent-parser_user.md",
    "poster_generator_design_spec_builder_user": "@prompts/poster-generator_design-spec-builder_user.md",
    "poster_generator_poster_code_generation_user": "@prompts/poster-generator_poster-code-generation_user.md"
  },
  "modelConfigs": {
    "poster_generator_intent_parser": "@model-configs/poster-generator_intent-parser.ts",
    "poster_generator_design_spec_builder": "@model-configs/poster-generator_design-spec-builder.ts",
    "poster_generator_poster_code_generation": "@model-configs/poster-generator_poster-code-generation.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "schema": {
        "sampleOutput": "string"
      },
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_371",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "schema": {},
      "values": {
        "id": "InstructorLLMNode_371",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"generatedResponse\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"poster_purpose\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"subject\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"target_audience\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"emotional_tone\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"visual_world\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"display_context\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"primary_message\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"style_references\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"explicit_content\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"headline\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"subtext\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"brand_or_name\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"date_or_event\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"call_to_action\": {\n              \"type\": \"string\",\n              \"required\": true\n            }\n          },\n          \"additionalProperties\": true\n        }\n      },\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/intent-parser-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/poster-generator_intent-parser_user.md"
          }
        ],
        "memories": "@model-configs/poster-generator_intent-parser.ts",
        "messages": "@model-configs/poster-generator_intent-parser.ts",
        "nodeName": "Intent Parser",
        "attachments": "@model-configs/poster-generator_intent-parser.ts",
        "generativeModelName": "@model-configs/poster-generator_intent-parser.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": true
  },
  {
    "id": "InstructorLLMNode_121",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "schema": {},
      "values": {
        "id": "InstructorLLMNode_121",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"generatedResponse\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"poster_name\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"overall_composition_note\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"layout\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"orientation\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"dimensions_px\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"grid_description\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"focal_point\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"whitespace_notes\": {\n              \"type\": \"string\",\n              \"required\": true\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"color_palette\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"background\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"primary\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"secondary\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"accent\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"text_main\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"text_subtle\": {\n              \"type\": \"string\",\n              \"required\": true\n            },\n            \"usage_notes\": {\n              \"type\": \"string\",\n              \"required\": true\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"typography\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"headline\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"font_family\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"size_px\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"weight\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"letter_spacing\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"line_height\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"color\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"transform\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                }\n              },\n              \"additionalProperties\": true\n            },\n            \"subtext\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"font_family\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"size_px\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"weight\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"letter_spacing\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"line_height\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"color\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                }\n              },\n              \"additionalProperties\": true\n            },\n            \"label\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"font_family\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"size_px\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"weight\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"color\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                }\n              },\n              \"additionalProperties\": true\n            },\n            \"cta\": {\n              \"type\": \"object\",\n              \"properties\": {\n                \"font_family\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"size_px\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"weight\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"color\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                },\n                \"background_color\": {\n                  \"type\": \"string\",\n                  \"required\": true\n                }\n              },\n              \"additionalProperties\": true\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"decorative_elements\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"name\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"svg_draw_instructions\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"position\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"size\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"color\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"z_layer\": {\n                \"type\": \"string\",\n                \"required\": true\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"content_blocks\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"role\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"text\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"typography_key\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"position\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"alignment\": {\n                \"type\": \"string\",\n                \"required\": true\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"animations\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"target_element\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"property\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"from\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"to\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"duration\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"easing\": {\n                \"type\": \"string\",\n                \"required\": true\n              },\n              \"loop\": {\n                \"type\": \"string\",\n                \"required\": true\n              }\n            },\n            \"additionalProperties\": true\n          }\n        }\n      },\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/design-spec-builder-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/poster-generator_design-spec-builder_user.md"
          }
        ],
        "memories": "@model-configs/poster-generator_design-spec-builder.ts",
        "messages": "@model-configs/poster-generator_design-spec-builder.ts",
        "nodeName": "Design Spec Builder",
        "attachments": "@model-configs/poster-generator_design-spec-builder.ts",
        "generativeModelName": "@model-configs/poster-generator_design-spec-builder.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_513",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "schema": {},
      "values": {
        "id": "InstructorLLMNode_513",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"html_code\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"poster_name\": {\n      \"type\": \"string\",\n      \"required\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/poster-code-generation-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/poster-generator_poster-code-generation_user.md"
          }
        ],
        "memories": "@model-configs/poster-generator_poster-code-generation.ts",
        "messages": "@model-configs/poster-generator_poster-code-generation.ts",
        "nodeName": "Poster Code Generation",
        "attachments": "@model-configs/poster-generator_poster-code-generation.ts",
        "generativeModelName": "@model-configs/poster-generator_poster-code-generation.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "modes": {},
      "nodeId": "graphqlResponseNode",
      "schema": {},
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"status\": \"complete\",\n  \"html_code\": \"{{InstructorLLMNode_513.output.html_code}}\",\n  \"poster_name\": \"{{InstructorLLMNode_513.output.poster_name}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_371",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_371",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_371-InstructorLLMNode_121",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_371",
    "target": "InstructorLLMNode_121",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_121-InstructorLLMNode_513",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_121",
    "target": "InstructorLLMNode_513",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_513-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_513",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };

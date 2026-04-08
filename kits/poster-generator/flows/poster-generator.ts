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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "intent_parser_system": "@prompts/intent-parser-system.md",
    "design_spec_builder_system": "@prompts/design-spec-builder-system.md",
    "poster_code_generation_system": "@prompts/poster-code-generation-system.md"
  },
  "modelConfigs": {
    "poster_generator_intent_parser": "@model-configs/poster-generator_intent-parser.ts",
    "poster_generator_design_spec_builder": "@model-configs/poster-generator_design-spec-builder.ts",
    "poster_generator_poster_code_generation": "@model-configs/poster-generator_poster-code-generation.ts"
  },
  "triggers": {
    "poster_generator_api_request": "@triggers/webhooks/poster-generator_api-request.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
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
        "responeType": "@triggers/webhooks/poster-generator_api-request.ts",
        "advance_schema": "@triggers/webhooks/poster-generator_api-request.ts"
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
            "content": "Transform the following raw poster idea into a fully resolved creative brief.\nUSER IDEA: {{triggerNode_1.output.user_input}}\nResolve every aspect completely. For any gap the user left open, make adecisive, well-reasoned creative choice. Think about:\nWhat is this poster actually for? (event, product, cause, art, announcement)\nWho will see it and where? (street, social media, gallery, venue wall)\nWhat is the single most important thing it must communicate?\nWhat should someone feel the instant they see it?\nWhat visual world does it belong to? (era, movement, aesthetic lineage)\nWhat words should be on it? Write the actual headline and supporting copy.\nBe decisive. Be specific. Be opinionated. A vague brief produces a genericposter. Fill every gap with intention."
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
            "content": "Produce a complete, exhaustive visual design specification from thisfully resolved creative brief.\nCREATIVE BRIEF:\n{{InstructorLLMNode_371.output.generatedResponse}}\nFor every decision, go one level deeper than obvious. Don't just say\"bold sans-serif headline\" — name the exact font, size, weight, tracking,color, and position. Don't just say \"decorative geometric shapes\" — describeeach shape's geometry, color, size, position, and animation behavior.\nThe developer building this has no design judgment — they will implementexactly what you specify and nothing more. Make every detail explicit."
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
            "content": "Build a complete, production-quality, self-contained HTML poster from\nthis exhaustive design specification.\nDESIGN SPECIFICATION:{{InstructorLLMNode_121.output.generatedResponse}}\nIMPLEMENTATION CHECKLIST — verify each before finalising:\n[ ] Poster dimensions match spec exactly\n[ ] All Google Fonts from spec are @imported and applied\n[ ] All hex colors from color_palette are used as specified\n[ ] Every content_block text appears verbatim at the correct position\n[ ] Every decorative_element from the spec is drawn as an inline SVG\n[ ] Every animation from the animations array is implemented\n[ ] No external image references anywhere in the file\n[ ] Poster is centered on the page with appropriate body background\n[ ] All text is legible — sufficient contrast, correct z-layer\n[ ] File is a single complete HTML document — nothing missing\nPush the visual quality. The spec is the floor, not the ceiling.\nIf the spec says \"starburst\", draw a beautiful starburst with considered\nproportions and stroke weight. If it says \"geometric border\", make it\nprecise and elegant. Craft every element as if it will be printed large."
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

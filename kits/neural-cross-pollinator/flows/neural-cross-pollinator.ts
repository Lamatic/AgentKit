// Flow: neural-cross-pollinator

// -- Meta --
export const meta = {
  "name": "Neural Cross-Pollinator",
  "description": "Finds structural parallels between two unrelated domains and proposes a critically-evaluated cross-domain innovation.",
  "tags": [
    "reasoning",
    "cross-domain",
    "innovation"
  ],
  "testInput": {
    "domainA": "bee colony behavior",
    "domainB": "stock market crashes"
  },
  "author": {
    "name": "Manha Kabir"
  }
};

// -- Inputs --
export const inputs = {
  "APIRequest": [
    {
      "name": "domainA",
      "label": "Domain A",
      "type": "string",
      "required": true,
      "isPrivate": false
    },
    {
      "name": "domainB",
      "label": "Domain B",
      "type": "string",
      "required": true,
      "isPrivate": false
    }
  ]
};

// -- References --
export const references = {
  "prompts": {
    "analysisSystem": "@prompts/neural-cross-pollinator_analyze-domain-a_system.md",
    "domainAUser": "@prompts/neural-cross-pollinator_analyze-domain-a_user.md",
    "domainBUser": "@prompts/neural-cross-pollinator_analyze-domain-b_user.md",
    "findParallelsSystem": "@prompts/neural-cross-pollinator_find-structural-parallels_system.md",
    "findParallelsUser": "@prompts/neural-cross-pollinator_find-structural-parallels_user.md",
    "transferMechanismSystem": "@prompts/neural-cross-pollinator_transfer-mechanism_system.md",
    "transferMechanismUser": "@prompts/neural-cross-pollinator_transfer-mechanism_user.md",
    "evaluateInnovationSystem": "@prompts/neural-cross-pollinator_evaluate-innovation_system.md",
    "evaluateInnovationUser": "@prompts/neural-cross-pollinator_evaluate-innovation_user.md",
    "presentSuccessSystem": "@prompts/neural-cross-pollinator_present-success_system.md",
    "presentSuccessUser": "@prompts/neural-cross-pollinator_present-success_user.md",
    "presentCaveatSystem": "@prompts/neural-cross-pollinator_present-caveat_system.md",
    "presentCaveatUser": "@prompts/neural-cross-pollinator_present-caveat_user.md"
  },
  "modelConfigs": {
    "groq": "@model-configs/neural-cross-pollinator_groq.ts"
  },
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "APIRequest",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "values": {
        "id": "APIRequest",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\"domainA\":\"string\",\"domainB\":\"string\"}"
      },
      "trigger": true
    }
  },
  {
    "id": "InstructorLLMNode_566",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 150
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Analyze Domain A",
        "schema": {
          "type": "object",
          "properties": {
            "entities": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "mechanisms": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "constraints": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "feedback_loops": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "adaptation_patterns": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        },
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_analyze-domain-a_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_analyze-domain-a_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "InstructorLLMNode_452",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 300
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Analyze Domain B",
        "schema": {
          "type": "object",
          "properties": {
            "entities": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "mechanisms": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "constraints": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "feedback_loops": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "adaptation_patterns": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        },
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_analyze-domain-b_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_analyze-domain-b_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "InstructorLLMNode_323",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 450
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Find Structural Parallels",
        "schema": {
          "type": "object",
          "properties": {
            "parallels": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "domainA_element": {
                    "type": "string"
                  },
                  "domainB_element": {
                    "type": "string"
                  },
                  "shared_structure": {
                    "type": "string"
                  }
                }
              }
            },
            "overall_analogy_strength": {
              "type": "string",
              "enum": [
                "strong",
                "moderate",
                "weak"
              ]
            }
          }
        },
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_find-structural-parallels_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_find-structural-parallels_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "InstructorLLMNode_572",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 600
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Transfer Mechanism",
        "schema": {
          "type": "object",
          "properties": {
            "selected_parallel": {
              "type": "object",
              "properties": {
                "domainA_element": {
                  "type": "string"
                },
                "domainB_element": {
                  "type": "string"
                },
                "shared_structure": {
                  "type": "string"
                }
              }
            },
            "transferred_mechanism": {
              "type": "string"
            },
            "target_domain": {
              "type": "string"
            },
            "proposed_innovation": {
              "type": "string"
            }
          }
        },
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_transfer-mechanism_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_transfer-mechanism_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "InstructorLLMNode_952",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 750
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "nodeName": "Evaluate Innovation",
        "schema": {
          "type": "object",
          "properties": {
            "eureka_moment": {
              "type": "string"
            },
            "novelty_score": {
              "type": "integer"
            },
            "feasibility_score": {
              "type": "integer"
            },
            "critique": {
              "type": "string"
            },
            "verdict": {
              "type": "string",
              "enum": [
                "strong",
                "weak"
              ]
            }
          }
        },
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_evaluate-innovation_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_evaluate-innovation_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "CheckVerdict",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 900
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Check Verdict",
        "conditions": [
          {
            "operator": null,
            "operands": [
              {
                "name": "{{InstructorLLMNode_952.output.verdict}}",
                "operator": "==",
                "value": "strong"
              }
            ]
          }
        ]
      }
    }
  },
  {
    "id": "LLMNode_400",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 1050
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Present Success",
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_present-success_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_present-success_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "LLMNode_743",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 1200
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Present Caveat",
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/neural-cross-pollinator_present-caveat_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/neural-cross-pollinator_present-caveat_user.md"
          }
        ],
        "generativeModelName": [
          "@model-configs/neural-cross-pollinator_groq.ts"
        ]
      }
    }
  },
  {
    "id": "APIResponse",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 1350
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"domainA_analysis\": \"{{InstructorLLMNode_566.output.entities}},{{InstructorLLMNode_566.output.mechanisms}},{{InstructorLLMNode_566.output.constraints}},{{InstructorLLMNode_566.output.feedback_loops}},{{InstructorLLMNode_566.output.adaptation_patterns}}\",\n  \"domainB_analysis\": \"{{InstructorLLMNode_452.output.entities}},{{InstructorLLMNode_452.output.mechanisms}},{{InstructorLLMNode_452.output.constraints}},{{InstructorLLMNode_452.output.feedback_loops}},{{InstructorLLMNode_452.output.adaptation_patterns}}\",\n  \"parallels\": \"{{InstructorLLMNode_323.output.parallels}}\",\n  \"proposed_innovation\": \"{{InstructorLLMNode_572.output.proposed_innovation}}\",\n  \"evaluation\": \"{{InstructorLLMNode_952.output.eureka_moment}},{{InstructorLLMNode_952.output.novelty_score}},{{InstructorLLMNode_952.output.feasibility_score}},{{InstructorLLMNode_952.output.critique}},{{InstructorLLMNode_952.output.verdict}}\",\n  \"success_summary\": \"{{LLMNode_400.output.generatedResponse}}\",\n  \"caveat_summary\": \"{{LLMNode_743.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "e1",
    "source": "APIRequest",
    "target": "InstructorLLMNode_566",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e2",
    "source": "InstructorLLMNode_566",
    "target": "InstructorLLMNode_452",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e3",
    "source": "InstructorLLMNode_452",
    "target": "InstructorLLMNode_323",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e4",
    "source": "InstructorLLMNode_323",
    "target": "InstructorLLMNode_572",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e5",
    "source": "InstructorLLMNode_572",
    "target": "InstructorLLMNode_952",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e6",
    "source": "InstructorLLMNode_952",
    "target": "CheckVerdict",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e7",
    "source": "CheckVerdict",
    "target": "LLMNode_400",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
    "label": "Condition 1"
  },
  {
    "id": "e8",
    "source": "CheckVerdict",
    "target": "LLMNode_743",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
    "label": "Else"
  },
  {
    "id": "e9",
    "source": "LLMNode_400",
    "target": "APIResponse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "e10",
    "source": "LLMNode_743",
    "target": "APIResponse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger",
    "source": "APIRequest",
    "target": "APIResponse",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };

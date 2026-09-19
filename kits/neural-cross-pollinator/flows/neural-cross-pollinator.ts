/*
 * # Neural Cross-Pollinator
 * Finds genuine structural parallels between two unrelated domains,
 * proposes a mechanism transfer as a candidate innovation, and
 * critically evaluates whether that idea is actually novel.
 */

// Flow: neural-cross-pollinator

export const meta = {
  name: "Neural Cross-Pollinator",
  description:
    "Finds structural parallels between two unrelated domains and proposes a critically-evaluated cross-domain innovation.",
  tags: ["reasoning", "cross-domain", "innovation"],
  testInput: { domainA: "bee colony behavior", domainB: "stock market crashes" },
  author: { name: "Manha Kabir" }
};

export const inputs = {
  APIRequest: [
    { name: "domainA", label: "Domain A", type: "string", required: true, isPrivate: false },
    { name: "domainB", label: "Domain B", type: "string", required: true, isPrivate: false }
  ]
};

export const references = {
  prompts: {
    analysisSystem: "@prompts/analysis-system.md",
    domainAUser: "@prompts/domain-a-user.md",
    domainBUser: "@prompts/domain-b-user.md",
    findParallelsSystem: "@prompts/find-parallels-system.md",
    findParallelsUser: "@prompts/find-parallels-user.md",
    transferMechanismSystem: "@prompts/transfer-mechanism-system.md",
    transferMechanismUser: "@prompts/transfer-mechanism-user.md",
    evaluateInnovationSystem: "@prompts/evaluate-innovation-system.md",
    evaluateInnovationUser: "@prompts/evaluate-innovation-user.md",
    presentSuccessSystem: "@prompts/present-success-system.md",
    presentSuccessUser: "@prompts/present-success-user.md",
    presentCaveatSystem: "@prompts/present-caveat-system.md",
    presentCaveatUser: "@prompts/present-caveat-user.md"
  },
  modelConfigs: {
    groq: "@model-configs/groq.ts"
  },
  constitutions: { default: "@constitutions/default.md" }
};

const analysisSchema = {
  type: "object",
  properties: {
    entities: { type: "array", items: { type: "string" } },
    mechanisms: { type: "array", items: { type: "string" } },
    constraints: { type: "array", items: { type: "string" } },
    feedback_loops: { type: "array", items: { type: "string" } },
    adaptation_patterns: { type: "array", items: { type: "string" } }
  }
};

export const nodes = [
  {
    id: "APIRequest",
    type: "triggerNode",
    data: {
      nodeId: "graphqlNode",
      nodeName: "API Request",
      values: {
        advance_schema: JSON.stringify({ domainA: "string", domainB: "string" })
      },
      responseType: "realtime"
    }
  },
  {
    id: "InstructorLLMNode_566",
    type: "dynamicNode",
    data: {
      nodeId: "instructorLLMNode",
      values: {
        nodeName: "Analyze Domain A",
        schema: analysisSchema,
        prompts: [
          { role: "system", content: "@prompts/analysis-system.md" },
          { role: "user", content: "@prompts/domain-a-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "InstructorLLMNode_452",
    type: "dynamicNode",
    data: {
      nodeId: "instructorLLMNode",
      values: {
        nodeName: "Analyze Domain B",
        schema: analysisSchema,
        prompts: [
          { role: "system", content: "@prompts/analysis-system.md" },
          { role: "user", content: "@prompts/domain-b-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "InstructorLLMNode_323",
    type: "dynamicNode",
    data: {
      nodeId: "instructorLLMNode",
      values: {
        nodeName: "Find Structural Parallels",
        schema: {
          type: "object",
          properties: {
            parallels: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  domainA_element: { type: "string" },
                  domainB_element: { type: "string" },
                  shared_structure: { type: "string" }
                }
              }
            },
            overall_analogy_strength: { type: "string", enum: ["strong", "moderate", "weak"] }
          }
        },
        prompts: [
          { role: "system", content: "@prompts/find-parallels-system.md" },
          { role: "user", content: "@prompts/find-parallels-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "InstructorLLMNode_572",
    type: "dynamicNode",
    data: {
      nodeId: "instructorLLMNode",
      values: {
        nodeName: "Transfer Mechanism",
        schema: {
          type: "object",
          properties: {
            selected_parallel: {
              type: "object",
              properties: {
                domainA_element: { type: "string" },
                domainB_element: { type: "string" },
                shared_structure: { type: "string" }
              }
            },
            transferred_mechanism: { type: "string" },
            target_domain: { type: "string" },
            proposed_innovation: { type: "string" }
          }
        },
        prompts: [
          { role: "system", content: "@prompts/transfer-mechanism-system.md" },
          { role: "user", content: "@prompts/transfer-mechanism-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "InstructorLLMNode_952",
    type: "dynamicNode",
    data: {
      nodeId: "instructorLLMNode",
      values: {
        nodeName: "Evaluate Innovation",
        schema: {
          type: "object",
          properties: {
            eureka_moment: { type: "string" },
            novelty_score: { type: "integer" },
            feasibility_score: { type: "integer" },
            critique: { type: "string" },
            verdict: { type: "string", enum: ["strong", "weak"] }
          }
        },
        prompts: [
          { role: "system", content: "@prompts/evaluate-innovation-system.md" },
          { role: "user", content: "@prompts/evaluate-innovation-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "CheckVerdict",
    type: "dynamicNode",
    data: {
      nodeId: "conditionNode",
      values: {
        nodeName: "Check Verdict",
        conditions: [
          {
            operator: null,
            operands: [
              {
                name: "{{InstructorLLMNode_952.output.verdict}}",
                operator: "==",
                value: "strong"
              }
            ]
          }
        ]
      }
    }
  },
  {
    id: "LLMNode_400",
    type: "dynamicNode",
    data: {
      nodeId: "llmNode",
      values: {
        nodeName: "Present Success",
        prompts: [
          { role: "system", content: "@prompts/present-success-system.md" },
          { role: "user", content: "@prompts/present-success-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "LLMNode_743",
    type: "dynamicNode",
    data: {
      nodeId: "llmNode",
      values: {
        nodeName: "Present Caveat",
        prompts: [
          { role: "system", content: "@prompts/present-caveat-system.md" },
          { role: "user", content: "@prompts/present-caveat-user.md" }
        ],
        generativeModelName: ["@model-configs/groq.ts"]
      }
    }
  },
  {
    id: "APIResponse",
    type: "dynamicNode",
    data: {
      nodeId: "graphqlNode",
      values: {
        nodeName: "API Response",
        outputMapping: {
          domainA_analysis:
            "{{InstructorLLMNode_566.output.entities}},{{InstructorLLMNode_566.output.mechanisms}},{{InstructorLLMNode_566.output.constraints}},{{InstructorLLMNode_566.output.feedback_loops}},{{InstructorLLMNode_566.output.adaptation_patterns}}",
          domainB_analysis:
            "{{InstructorLLMNode_452.output.entities}},{{InstructorLLMNode_452.output.mechanisms}},{{InstructorLLMNode_452.output.constraints}},{{InstructorLLMNode_452.output.feedback_loops}},{{InstructorLLMNode_452.output.adaptation_patterns}}",
          parallels: "{{InstructorLLMNode_323.output.parallels}}",
          proposed_innovation: "{{InstructorLLMNode_572.output.proposed_innovation}}",
          evaluation:
            "{{InstructorLLMNode_952.output.eureka_moment}},{{InstructorLLMNode_952.output.novelty_score}},{{InstructorLLMNode_952.output.feasibility_score}},{{InstructorLLMNode_952.output.critique}},{{InstructorLLMNode_952.output.verdict}}",
          success_summary: "{{LLMNode_400.output.generatedResponse}}",
          caveat_summary: "{{LLMNode_743.output.generatedResponse}}"
        }
      }
    }
  }
];

export const edges = [
  { id: "e1", source: "APIRequest", target: "InstructorLLMNode_566", type: "defaultEdge" },
  { id: "e2", source: "InstructorLLMNode_566", target: "InstructorLLMNode_452", type: "defaultEdge" },
  { id: "e3", source: "InstructorLLMNode_452", target: "InstructorLLMNode_323", type: "defaultEdge" },
  { id: "e4", source: "InstructorLLMNode_323", target: "InstructorLLMNode_572", type: "defaultEdge" },
  { id: "e5", source: "InstructorLLMNode_572", target: "InstructorLLMNode_952", type: "defaultEdge" },
  { id: "e6", source: "InstructorLLMNode_952", target: "CheckVerdict", type: "defaultEdge" },
  { id: "e7", source: "CheckVerdict", target: "LLMNode_400", type: "defaultEdge", label: "Condition 1" },
  { id: "e8", source: "CheckVerdict", target: "LLMNode_743", type: "defaultEdge", label: "Else" },
  { id: "e9", source: "LLMNode_400", target: "APIResponse", type: "responseEdge" },
  { id: "e10", source: "LLMNode_743", target: "APIResponse", type: "responseEdge" }
];

export default { meta, inputs, references, nodes, edges };
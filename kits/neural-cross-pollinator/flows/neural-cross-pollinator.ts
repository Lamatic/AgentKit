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

const analysisSystemPrompt =
  "You are a structural analysis engine. Given a domain, break it down into its core structural components. Be precise and avoid vague generalities. Return only the structured breakdown, no commentary.";

const groqModel = {
  configName: "configA",
  type: "generator/text",
  provider_name: "groq",
  credential_name: "Groq neural",
  model_name: "groq/openai/gpt-oss-120b",
  params: {}
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
          { role: "system", content: analysisSystemPrompt },
          { role: "user", content: "Analyze this domain : {{APIRequest.output.domainA}}" }
        ],
        generativeModelName: [groqModel]
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
          { role: "system", content: analysisSystemPrompt },
          { role: "user", content: "Analyze this domain : {{APIRequest.output.domainB}}" }
        ],
        generativeModelName: [groqModel]
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
          {
            role: "system",
            content:
              "You are a cross-domain pattern-matching engine. You will be given two structural analyses of unrelated domains. Identify genuine structural parallels between them — matching mechanisms, feedback loops, or adaptation patterns that serve an equivalent function despite belonging to different fields. Reject superficial or forced comparisons. Only report parallels with real structural grounding."
          },
          {
            role: "user",
            content:
              "Domain A analysis: {{InstructorLLMNode_566.output.entities}},{{InstructorLLMNode_566.output.mechanisms}},{{InstructorLLMNode_566.output.constraints}},{{InstructorLLMNode_566.output.feedback_loops}},{{InstructorLLMNode_566.output.adaptation_patterns}} Domain B analysis: {{InstructorLLMNode_452.output.entities}},{{InstructorLLMNode_452.output.mechanisms}},{{InstructorLLMNode_452.output.constraints}},{{InstructorLLMNode_452.output.feedback_loops}},{{InstructorLLMNode_452.output.adaptation_patterns}}"
          }
        ],
        generativeModelName: [groqModel]
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
          {
            role: "system",
            content:
              "You are an innovation engine. Given a set of structural parallels between two domains, select the single most promising parallel — the one with the clearest and most actionable shared structure. Propose a concrete mechanism transfer: describe how the mechanism from one domain could be adapted into an actionable innovation in the other domain. Be specific and practical, not vague or poetic."
          },
          {
            role: "user",
            content:
              "Structural parallels found : {{InstructorLLMNode_323.output.parallels}} Overall analogy strength: {{InstructorLLMNode_323.output.overall_analogy_strength}}"
          }
        ],
        generativeModelName: [groqModel]
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
          {
            role: "system",
            content:
              "You are a rigorous, skeptical critic evaluating a proposed cross-domain innovation. Do not be flattering. Assess whether the proposed mechanism transfer is genuinely novel, technically feasible, and non-obvious — or whether it is superficial, impractical, or a re-labeling of an existing idea. Score honestly."
          },
          {
            role: "user",
            content:
              "Proposed innovation: {{InstructorLLMNode_572.output.proposed_innovation}} Mechanism details: {{InstructorLLMNode_572.output.transferred_mechanism}}"
          }
        ],
        generativeModelName: [groqModel]
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
          {
            role: "system",
            content:
              "You are the final presenter for a cross-domain innovation engine called Neural Cross-Pollinator. A rigorous critic has already evaluated this specific idea and rated it a genuine, novel innovation. Your job is to present it confidently and clearly to the end user, in plain language, without hedging or over-qualifying."
          },
          {
            role: "user",
            content:
              "Transfer Mechanism : {{InstructorLLMNode_572.output.proposed_innovation}} Evaluate Innovation : {{InstructorLLMNode_952.output.eureka_moment}}"
          }
        ],
        generativeModelName: [groqModel]
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
          {
            role: "system",
            content:
              "You are the final presenter for a cross-domain innovation engine called Neural Cross-Pollinator. A rigorous critic has already evaluated this specific idea and found it interesting but not genuinely novel or fully practical. Your job is to communicate this honestly to the end user — acknowledge the structural parallel that was found, but be direct that it doesn't yet rise to a real innovation, and briefly say why."
          },
          {
            role: "user",
            content: "Evaluate innovation : {{InstructorLLMNode_952.output.critique}}"
          }
        ],
        generativeModelName: [groqModel]
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
          final_summary: "{{LLMNode_400.output.generatedResponse}}{{LLMNode_743.output.generatedResponse}}"
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
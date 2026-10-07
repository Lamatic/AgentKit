/*
 * # Carbon Advisor
 *
 * The judgment layer of the Cloud Carbon Advisor kit. The Next.js app computes
 * an emissions footprint deterministically and sends the ranked hotspots here;
 * this flow decides *why* each hotspot emits what it does and *which lever*
 * would cut it — and returns that judgment as enums, never as a number.
 *
 *   trigger (API Request)
 *     → Generate JSON (structured LLM)  diagnoses[] + recommendations[]
 *     → response                        { diagnoses, recommendations }
 *
 * The single structured-output node returns one diagnosis and one
 * recommendation per hotspot, keyed by hotspotId. The app then validates every
 * enum, drops any invented id (`apps/lib/plan.ts::coercePlan`), and prices each
 * recommendation from a fixed, unit-tested table — so no number in a report
 * ever originates in the model.
 *
 * Import this file into Lamatic Studio, attach a model credential to the
 * Generate JSON node, deploy, and copy the Flow ID into
 * LAMATIC_CARBON_ADVISOR_FLOW_ID.
 */

// Flow: carbon-advisor

export const meta = {
  name: "carbon-advisor",
  description:
    "Diagnoses the dominant carbon driver of each cloud usage hotspot and recommends a decarbonization lever — returned as structured judgment, never a computed number.",
  tags: ["sustainability", "cloud-carbon", "greenops", "finops"],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: { name: "", email: "" },
};

export const inputs = {
  InstructorLLMNode_505: [
    { name: "generativeModelName", label: "Generative Model Name", type: "model" },
  ],
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    carbon_advisor_generate_json_system: "@prompts/carbon-advisor_generate-json_system.md",
    carbon_advisor_generate_json_user: "@prompts/carbon-advisor_generate-json_user.md",
  },
  modelConfigs: {
    carbon_advisor_generate_json: "@model-configs/carbon-advisor_generate-json.ts",
  },
};

export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          "{\n  \"hotspots\": \"[string]\",\n  \"periodLabel\": \"string\",\n  \"currency\": \"string\"\n}",
      },
    },
  },
  {
    id: "InstructorLLMNode_505",
    type: "dynamicNode",
    position: { x: 0, y: 130 },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_505",
        nodeName: "Generate JSON",
        schema:
          "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"diagnoses\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"hotspotId\": { \"type\": \"string\" },\n          \"driverClass\": { \"type\": \"string\", \"enum\": [\"dirty-grid\", \"compute-heavy\", \"storage-bloat\", \"egress-heavy\", \"over-provisioned\", \"mixed\"] },\n          \"confidence\": { \"type\": \"string\", \"enum\": [\"high\", \"medium\", \"low\"] },\n          \"evidence\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n          \"reasoning\": { \"type\": \"string\" },\n          \"rejectedDrivers\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"object\",\n              \"properties\": { \"driver\": { \"type\": \"string\" }, \"whyNot\": { \"type\": \"string\" } },\n              \"required\": [\"driver\", \"whyNot\"],\n              \"additionalProperties\": false\n            }\n          }\n        },\n        \"required\": [\"hotspotId\", \"driverClass\", \"confidence\"],\n        \"additionalProperties\": false\n      }\n    },\n    \"recommendations\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"hotspotId\": { \"type\": \"string\" },\n          \"action\": { \"type\": \"string\" },\n          \"rationale\": { \"type\": \"string\" },\n          \"effort\": { \"type\": \"string\", \"enum\": [\"low\", \"medium\", \"high\"] },\n          \"risk\": { \"type\": \"string\", \"enum\": [\"low\", \"medium\", \"high\"] },\n          \"prerequisites\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n          \"reductionKey\": { \"type\": \"string\", \"enum\": [\"region-migration-major\", \"region-migration-partial\", \"rightsize-major\", \"rightsize-moderate\", \"schedule-shift\", \"storage-tier\", \"arm-migration\", \"eliminate-full\", \"none\", \"unknown\"] }\n        },\n        \"required\": [\"hotspotId\", \"action\", \"reductionKey\"],\n        \"additionalProperties\": false\n      }\n    }\n  },\n  \"required\": [\"diagnoses\", \"recommendations\"],\n  \"additionalProperties\": false\n}",
        prompts: [
          { id: "carbon-advisor-generate-json-system", role: "system", content: "@prompts/carbon-advisor_generate-json_system.md" },
          { id: "carbon-advisor-generate-json-user", role: "user", content: "@prompts/carbon-advisor_generate-json_user.md" },
        ],
        memories: "[]",
        generativeModelName: "@model-configs/carbon-advisor_generate-json.ts",
      },
    },
  },
  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: { x: 0, y: 260 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        nodeName: "",
        outputMapping:
          "{\n  \"diagnoses\": \"{{InstructorLLMNode_505.output.diagnoses}}\",\n  \"recommendations\": \"{{InstructorLLMNode_505.output.recommendations}}\"\n}",
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_505",
    source: "triggerNode_1",
    target: "InstructorLLMNode_505",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_505-responseNode_triggerNode_1",
    source: "InstructorLLMNode_505",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-responseNode_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };

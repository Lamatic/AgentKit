/*
 * # Vehicle Service Advisor
 * Accepts owner-reported vehicle details and symptoms, then produces a
 * safety-first triage report. The report prioritizes immediate risk, explains
 * possible causes without claiming a diagnosis, and prepares a concise handoff
 * for a qualified technician.
 */

// Flow: vehicle-service-advisor

export const meta = {
  name: "Vehicle Service Advisor",
  description:
    "Creates a structured vehicle triage report from symptoms, warnings, mileage, and recent service history.",
  tags: ["automotive", "maintenance", "triage", "safety"],
  testInput: {
    make: "Honda",
    model: "City",
    year: "2018",
    mileage: "74000 km",
    fuel_type: "petrol",
    symptoms: "Temperature rises in traffic and there is a sweet smell after parking.",
    warning_lights: "Temperature warning appeared once.",
    recent_service: "Coolant topped up two weeks ago.",
    drivability: "limited",
  },
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/vehicle-service-advisor",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Sai Varun",
    email: "saivarun1410@gmail.com",
  },
};

export const inputs = {
  LLMNode_201: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
    },
  ],
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    vehicle_service_advisor_llmnode_201_system_0:
      "@prompts/vehicle-service-advisor_llmnode-201_system_0.md",
    vehicle_service_advisor_llmnode_201_user_1:
      "@prompts/vehicle-service-advisor_llmnode-201_user_1.md",
  },
  modelConfigs: {
    vehicle_service_advisor_llmnode_201_generative_model_name:
      "@model-configs/vehicle-service-advisor_llmnode-201_generative-model-name.ts",
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
        nodeName: "Vehicle observations",
        responeType: "realtime",
        advance_schema:
          '{\n  "make": "string",\n  "model": "string",\n  "year": "string",\n  "mileage": "string",\n  "fuel_type": "string",\n  "symptoms": "string",\n  "warning_lights": "string",\n  "recent_service": "string",\n  "drivability": "string"\n}',
      },
    },
  },
  {
    id: "LLMNode_201",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        tools: [],
        prompts: [
          {
            id: "vehicle-service-system-prompt",
            role: "system",
            content:
              "@prompts/vehicle-service-advisor_llmnode-201_system_0.md",
          },
          {
            id: "vehicle-service-user-prompt",
            role: "user",
            content: "@prompts/vehicle-service-advisor_llmnode-201_user_1.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Assess vehicle",
        attachments: "",
        credentials: "",
        generativeModelName:
          "@model-configs/vehicle-service-advisor_llmnode-201_generative-model-name.ts",
      },
    },
  },
  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping:
          '{\n  "report": "{{LLMNode_201.output.generatedResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_201",
    source: "triggerNode_1",
    target: "LLMNode_201",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_201-responseNode_triggerNode_1",
    source: "LLMNode_201",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-trigger-triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };

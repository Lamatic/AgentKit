/*
 * # Calibrate Scorecard
 * Turns a role rubric plus multi-interviewer notes into a calibrated hiring scorecard, disagreement map, recommendation, and decision brief.
 *
 * ## Purpose
 * Hiring managers often receive fragmented panel feedback with uneven scoring rigor. This flow normalizes that input, extracts a structured calibrated scorecard, and composes a human-readable hiring-committee brief.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `job_title` | `string` | Yes | Role being hired for |
 * | `level` | `string` | No | Seniority / level |
 * | `rubric` | `string` | Yes | Competency rubric text |
 * | `interviewer_notes` | `string` | Yes | Notes from 2+ interviewers |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `scorecard` | `object` | Structured calibration JSON from InstructorLLM |
 * | `brief` | `string` | Markdown hiring-committee brief |
 */

// Flow: calibrate-scorecard

export const meta = {
  name: "Calibrate Scorecard",
  description:
    "Synthesize multi-interviewer feedback into a calibrated hiring scorecard and decision brief.",
  tags: ["hiring", "interview", "scorecard"],
  testInput: {
    job_title: "Senior Backend Engineer",
    level: "L5",
    rubric:
      "System Design (High): scalable services, tradeoffs, reliability\nCoding (High): correctness, clarity, edge cases\nOwnership (Medium): end-to-end delivery, communication",
    interviewer_notes:
      "Interviewer 1 (Alice, Staff Eng):\nStrong system design around caching and failover. Coding solid but a bit slow. Ownership examples were concrete. Score: Design 4, Coding 3, Ownership 4.\n\n---\n\nInterviewer 2 (Bob, Eng Manager):\nDesign felt hand-wavy on consistency. Coding was clean. Concerned about stakeholder communication. Score: Design 2, Coding 4, Ownership 2.",
  },
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/interview-scorecard-calibrator",
  documentationUrl: "",
  deployUrl: "",
};

export const inputs = {
  InstructorLLMNode_220: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      mode: "instructor",
      description: "Select the model to generate structured scorecard JSON.",
      modelType: "generator/text",
      required: true,
      isPrivate: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {},
        },
      ],
      typeOptions: {
        loadOptionsMethod: "listModels",
      },
    },
  ],
  LLMNode_440: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model to compose the hiring brief.",
      required: true,
      defaultValue: [
        {
          configName: "configA",
          type: "generator/text",
          provider_name: "",
          credential_name: "",
          params: {},
        },
      ],
      typeOptions: {
        loadOptionsMethod: "listModels",
      },
      isPrivate: true,
    },
  ],
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    calibrate_scorecard_calibrate_system:
      "@prompts/calibrate-scorecard_calibrate_system.md",
    calibrate_scorecard_calibrate_user:
      "@prompts/calibrate-scorecard_calibrate_user.md",
    calibrate_scorecard_compose_system:
      "@prompts/calibrate-scorecard_compose_system.md",
    calibrate_scorecard_compose_user:
      "@prompts/calibrate-scorecard_compose_user.md",
  },
  modelConfigs: {
    calibrate_scorecard_calibrate:
      "@model-configs/calibrate-scorecard_calibrate.ts",
    calibrate_scorecard_compose:
      "@model-configs/calibrate-scorecard_compose.ts",
  },
  scripts: {
    calibrate_scorecard_normalize:
      "@scripts/calibrate-scorecard_normalize.ts",
  },
};

export const nodes = [
  {
    id: "triggerNode_1",
    data: {
      modes: {},
      nodeId: "graphqlNode",
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          '{\n  "job_title": "string",\n  "level": "string",\n  "rubric": "string",\n  "interviewer_notes": "string"\n}',
      },
      trigger: true,
    },
    type: "triggerNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 0 },
    selected: true,
  },
  {
    id: "codeNode_110",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "codeNode",
      values: {
        id: "codeNode_110",
        nodeName: "Normalize Inputs",
        code: "@scripts/calibrate-scorecard_normalize.ts",
        inputs: {
          job_title: "{{triggerNode_1.output.job_title}}",
          level: "{{triggerNode_1.output.level}}",
          rubric: "{{triggerNode_1.output.rubric}}",
          interviewer_notes: "{{triggerNode_1.output.interviewer_notes}}",
        },
      },
    },
    type: "dynamicNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 130 },
    selected: false,
  },
  {
    id: "InstructorLLMNode_220",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_220",
        tools: [],
        schema:
          '{\n  "type": "object",\n  "properties": {\n    "candidate_summary": { "type": "string" },\n    "competencies": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "name": { "type": "string" },\n          "weight": { "type": "string" },\n          "calibrated_score": { "type": "number" },\n          "evidence": { "type": "array", "items": { "type": "string" } },\n          "missing_evidence": { "type": "string" },\n          "interviewer_spread": { "type": "string" }\n        }\n      }\n    },\n    "disagreements": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "topic": { "type": "string" },\n          "interviewers": { "type": "array", "items": { "type": "string" } },\n          "summary": { "type": "string" },\n          "severity": { "type": "string" }\n        }\n      }\n    },\n    "recommendation": { "type": "string" },\n    "confidence": { "type": "number" },\n    "rationale": { "type": "string" },\n    "follow_up_questions": { "type": "array", "items": { "type": "string" } },\n    "email_draft": { "type": "string" }\n  }\n}',
        prompts: [
          {
            id: "isc-system-001",
            role: "system",
            content: "@prompts/calibrate-scorecard_calibrate_system.md",
          },
          {
            id: "isc-user-001",
            role: "user",
            content: "@prompts/calibrate-scorecard_calibrate_user.md",
          },
        ],
        memories: "@model-configs/calibrate-scorecard_calibrate.ts",
        messages: "@model-configs/calibrate-scorecard_calibrate.ts",
        nodeName: "Calibrate Scorecard",
        attachments: "@model-configs/calibrate-scorecard_calibrate.ts",
        generativeModelName: "@model-configs/calibrate-scorecard_calibrate.ts",
      },
    },
    type: "dynamicNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 260 },
    selected: false,
  },
  {
    id: "LLMNode_440",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "LLMNode",
      values: {
        id: "LLMNode_440",
        tools: [],
        prompts: [
          {
            id: "isc-system-002",
            role: "system",
            content: "@prompts/calibrate-scorecard_compose_system.md",
          },
          {
            id: "isc-user-002",
            role: "user",
            content: "@prompts/calibrate-scorecard_compose_user.md",
          },
        ],
        memories: "@model-configs/calibrate-scorecard_compose.ts",
        messages: "@model-configs/calibrate-scorecard_compose.ts",
        nodeName: "Compose Brief",
        attachments: "@model-configs/calibrate-scorecard_compose.ts",
        credentials: "@model-configs/calibrate-scorecard_compose.ts",
        generativeModelName: "@model-configs/calibrate-scorecard_compose.ts",
      },
    },
    type: "dynamicNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 390 },
    selected: false,
  },
  {
    id: "responseNode_triggerNode_1",
    data: {
      label: "Response",
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        needs: ["InstructorLLMNode_220", "LLMNode_440"],
        outputMapping:
          '{\n  "scorecard": "{{InstructorLLMNode_220.output}}",\n  "brief": "{{LLMNode_440.output.generatedResponse}}"\n}',
      },
      isResponseNode: true,
    },
    type: "responseNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 520 },
    selected: false,
  },
];

export const edges = [
  {
    id: "triggerNode_1-codeNode_110-100",
    type: "defaultEdge",
    source: "triggerNode_1",
    target: "codeNode_110",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "codeNode_110-InstructorLLMNode_220-200",
    type: "defaultEdge",
    source: "codeNode_110",
    target: "InstructorLLMNode_220",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "InstructorLLMNode_220-LLMNode_440-300",
    type: "defaultEdge",
    source: "InstructorLLMNode_220",
    target: "LLMNode_440",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "LLMNode_440-responseNode_triggerNode_1-400",
    type: "defaultEdge",
    source: "LLMNode_440",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "response-trigger_triggerNode_1",
    type: "responseEdge",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    selected: false,
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
  },
];

export default { meta, inputs, references, nodes, edges };

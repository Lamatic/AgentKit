/*
 * # SRE Incident Postmortem Agent
 *
 * A synchronous Lamatic flow that converts incident response notes into a
 * structured, blameless SRE postmortem.
 *
 * ## Purpose
 * The flow accepts service, alert, symptom, timeline, impact, and status fields
 * from a GraphQL trigger. It uses a postmortem generation prompt to synthesize a
 * review-ready JSON response containing severity, summary, suspected root cause,
 * timeline, remediation, prevention work, owner follow-ups, and a Markdown draft.
 *
 * ## Inputs
 * - service_name: affected service or system
 * - incident_title: short incident title
 * - alert_details: alert source, alert text, signal, or threshold context
 * - logs_or_symptoms: logs, symptoms, metrics, traces, or observed behavior
 * - timeline_notes: rough responder timeline
 * - impact_description: customer, business, or operational impact
 * - current_status: current mitigation or resolution status
 *
 * ## Output
 * The flow returns a `postmortem` object containing `severity`,
 * `executive_summary`, `suspected_root_cause`, `timeline`, `customer_impact`,
 * `immediate_remediation`, `long_term_prevention`, `owner_followups`, and
 * `markdown_postmortem`.
 */

// Flow: sre-incident-postmortem-agent

export const meta = {
  name: "SRE Incident Postmortem Agent",
  description:
    "Generate a blameless SRE incident postmortem from incident response notes.",
  tags: ["sre", "incident-response", "postmortem", "reliability"],
  testInput: "",
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/sre-incident-postmortem-agent",
  documentationUrl: "",
  deployUrl: "",
};

export const inputs = {
  postmortem_generator: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      modelType: "generator/text",
      mode: "chat",
      description: "Select the model used to generate the postmortem.",
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
          '{\n  "service_name": "string",\n  "incident_title": "string",\n  "alert_details": "string",\n  "logs_or_symptoms": "string",\n  "timeline_notes": "string",\n  "impact_description": "string",\n  "current_status": "string"\n}',
      },
      trigger: true,
    },
    type: "triggerNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 0,
    },
    selected: false,
  },
  {
    id: "InstructorLLMNode_1",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_1",
        tools: [],
        schema:
          '{\n  "type": "object",\n  "properties": {\n    "postmortem": {\n      "type": "object",\n      "properties": {\n        "severity": { "type": "string" },\n        "executive_summary": { "type": "string" },\n        "suspected_root_cause": { "type": "string" },\n        "timeline": { "type": "array", "items": { "type": "string" } },\n        "customer_impact": { "type": "string" },\n        "immediate_remediation": { "type": "string" },\n        "long_term_prevention": { "type": "array", "items": { "type": "string" } },\n        "owner_followups": { "type": "array", "items": { "type": "string" } },\n        "markdown_postmortem": { "type": "string" }\n      }\n    }\n  }\n}',
        prompts: [
          {
            id: "8c5aa66f-2461-42c2-bc59-4f2f00ef78a1",
            role: "system",
            content:
              "@prompts/sre-incident-postmortem-agent_postmortem-generator_system.md",
          },
          {
            id: "d4da75c5-566a-4059-9577-7f28d930ef0b",
            role: "user",
            content:
              "Service: {{triggerNode_1.output.service_name}}\nIncident title: {{triggerNode_1.output.incident_title}}\nAlert details: {{triggerNode_1.output.alert_details}}\nLogs or symptoms: {{triggerNode_1.output.logs_or_symptoms}}\nTimeline notes: {{triggerNode_1.output.timeline_notes}}\nImpact description: {{triggerNode_1.output.impact_description}}\nCurrent status: {{triggerNode_1.output.current_status}}",
          },
        ],
        memories:
          "@model-configs/sre-incident-postmortem-agent_postmortem-generator.ts",
        messages:
          "@model-configs/sre-incident-postmortem-agent_postmortem-generator.ts",
        nodeName: "Postmortem Generator",
        attachments:
          "@model-configs/sre-incident-postmortem-agent_postmortem-generator.ts",
        generativeModelName:
          "@model-configs/sre-incident-postmortem-agent_postmortem-generator.ts",
      },
    },
    type: "dynamicNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 130,
    },
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
        outputMapping:
          '{\n  "postmortem": "{{InstructorLLMNode_1.output.postmortem}}"\n}',
      },
      isResponseNode: true,
    },
    type: "responseNode",
    measured: {
      width: 216,
      height: 93,
    },
    position: {
      x: 0,
      y: 260,
    },
    selected: false,
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_1",
    source: "triggerNode_1",
    target: "InstructorLLMNode_1",
    sourceHandle: "source",
    targetHandle: "target",
    type: "buttonedge",
  },
  {
    id: "InstructorLLMNode_1-responseNode_triggerNode_1",
    source: "InstructorLLMNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "source",
    targetHandle: "target",
    type: "buttonedge",
  },
  {
    id: "response-trigger_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "response-source",
    targetHandle: "response-target",
    type: "buttonedge",
  },
];

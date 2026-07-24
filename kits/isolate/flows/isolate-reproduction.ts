/*
 * Isolate's Lamatic control-plane flow.
 *
 * The Supervisor investigates a public GitHub issue and delegates every
 * workspace mutation and command to the saved, authenticated Isolate Runtime
 * MCP connection. The runtime—not the model—decides whether the collected
 * evidence satisfies the reproduction gate.
 */

export const meta = {
  name: "Isolate Reproduction",
  description:
    "Reproduce a vague GitHub issue in a disposable sandbox and return evidence-backed findings.",
  tags: ["Developer Tools", "GitHub", "MCP"],
  testInput: {
    repositoryUrl: "https://github.com/Dhruv2mars/isolate-cli-testbed",
    issueUrl:
      "https://github.com/Dhruv2mars/isolate-cli-testbed/issues/1",
    ref: "main",
  },
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/isolate",
  documentationUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/isolate/README.md",
  deployUrl: "https://studio.lamatic.ai",
  author: {
    name: "Dhruv Sharma",
    email: "dhruv2mars@gmail.com",
  },
};

export const inputs = {};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
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
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: JSON.stringify({
          type: "object",
          required: ["repositoryUrl", "issueUrl"],
          properties: {
            repositoryUrl: { type: "string", format: "uri" },
            issueUrl: { type: "string", format: "uri" },
            ref: { type: "string", default: "main" },
          },
        }),
      },
    },
  },
  {
    id: "agentNode_isolate",
    type: "agentNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "agentNode",
      values: {
        nodeName: "Isolate Supervisor",
        tools: ["Isolate Runtime"],
        agents: [],
        prompts: [
          {
            id: "isolate-supervisor-system",
            role: "system",
            content:
              "Investigate the supplied public GitHub issue. Use only the saved Isolate Runtime MCP tools for sandbox and command operations. Form a concrete hypothesis, create a sandbox, run focused probes, and call certify_reproduction with repeated candidate runs plus a rejecting control. Never claim reproduction unless the deterministic certification tool returns reproduced. Always delete the sandbox before finishing and report the commands, observations, and certification outcome.",
          },
          {
            id: "isolate-supervisor-user",
            role: "user",
            content:
              "Repository: {{triggerNode_1.output.repositoryUrl}}\nIssue: {{triggerNode_1.output.issueUrl}}\nRef: {{triggerNode_1.output.ref}}",
          },
        ],
        messages: "[]",
        stopWord: "",
        connectedTo: "agentLoopEndNode_isolate",
        maxIterations: 12,
        generativeModelName: {},
      },
    },
  },
  {
    id: "agentLoopEndNode_isolate",
    type: "agentLoopEndNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "agentLoopEndNode",
      values: {
        nodeName: "Agent Loop End",
        connectedTo: "agentNode_isolate",
      },
    },
  },
  {
    id: "graphqlResponseNode_isolate",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping:
          '{\n  "report": "{{agentLoopEndNode_isolate.output.finalResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "trigger-supervisor",
    source: "triggerNode_1",
    target: "agentNode_isolate",
    type: "defaultEdge",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "supervisor-loop-end",
    source: "agentNode_isolate",
    target: "agentLoopEndNode_isolate",
    type: "agentLoopEdge",
    sourceHandle: "bottom",
    targetHandle: "top",
    data: { condition: "Agent Loop End", invisible: true },
  },
  {
    id: "loop-end-supervisor",
    source: "agentLoopEndNode_isolate",
    target: "agentNode_isolate",
    type: "agentLoopEdge",
    sourceHandle: "bottom",
    targetHandle: "top",
    data: { condition: "Agent Loop End", invisible: false },
  },
  {
    id: "loop-end-response",
    source: "agentLoopEndNode_isolate",
    target: "graphqlResponseNode_isolate",
    type: "defaultEdge",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "trigger-response",
    source: "triggerNode_1",
    target: "graphqlResponseNode_isolate",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };

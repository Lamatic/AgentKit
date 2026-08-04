/*
 * # CI/CD Diagnosis Flow
 * Ingests CI/CD failure logs, sanitizes sensitive tokens, retrieves relevant failure patterns from knowledge embeddings, analyzes failure root causes via Gemini 2.0, and generates structured recovery actions and git diff patches.
 */

// Flow: cicd-diagnosis

export const meta = {
  name: "CI/CD Pipeline Failure Diagnosis",
  description: "Ingests CI/CD failure logs, sanitizes sensitive tokens, and analyzes failure root causes with Gemini 2.0 to generate structured remediation plans and actionable code patches.",
  tags: ["ci-cd", "devops", "diagnosis", "rag", "gemini"],
  testInput: {
    logContent: "npm ERR! code ENOENT\nnpm ERR! syscall open\nnpm ERR! path /app/package.json",
    repository: "octocat/hello-world",
    branch: "main",
    commitSha: "7fd1a60b01f91b314f59955a4e4d4e80d8edf11d"
  },
  author: {
    name: "Pawan Chhimwal",
    email: ""
  }
};

export const inputs = {
  InstructorLLMNode_analyzer: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model"
    }
  ]
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md"
  },
  prompts: {
    analyzer_system: "@prompts/cicd-diagnosis_analyzer_system.md",
    analyzer_user: "@prompts/cicd-diagnosis_analyzer_user.md"
  },
  modelConfigs: {
    analyzer_config: "@model-configs/cicd-diagnosis_analyzer.ts"
  },
  scripts: {
    sanitize_logs: "@scripts/cicd-diagnosis_sanitize_logs.ts"
  }
};

export const nodes = [
  {
    nodeId: "triggerNode_1",
    nodeType: "apiTriggerNode",
    name: "API Request",
    values: {
      inputSchema: {
        logContent: { type: "string", required: true },
        repository: { type: "string", required: false },
        branch: { type: "string", required: false },
        commitSha: { type: "string", required: false }
      }
    }
  },
  {
    nodeId: "codeNode_sanitize",
    nodeType: "codeNode",
    name: "Sanitize Raw Logs",
    values: {
      code: "@scripts/cicd-diagnosis_sanitize_logs.ts",
      inputs: {
        rawLog: "{{triggerNode_1.output.logContent}}"
      }
    }
  },
  {
    nodeId: "InstructorLLMNode_analyzer",
    nodeType: "instructorLlmNode",
    name: "Gemini Failure Analyzer",
    values: {
      generativeModelName: "@model-configs/cicd-diagnosis_analyzer.ts",
      prompts: [
        { role: "system", content: "@prompts/cicd-diagnosis_analyzer_system.md" },
        { role: "user", content: "@prompts/cicd-diagnosis_analyzer_user.md" }
      ]
    }
  }
];

export const edges = [
  {
    edgeId: "edge_1",
    source: "triggerNode_1",
    target: "codeNode_sanitize"
  },
  {
    edgeId: "edge_2",
    source: "codeNode_sanitize",
    target: "InstructorLLMNode_analyzer"
  }
];

export default { meta, inputs, references, nodes, edges };

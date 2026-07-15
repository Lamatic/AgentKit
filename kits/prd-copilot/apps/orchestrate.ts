export interface FlowConfig {
  name: string;
  type: string;
  workflowId?: string;
  description: string;
  expectedOutput: string[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  mode: string;
  polling: string;
}

export interface ApiConfig {
  endpoint?: string;
  projectId?: string;
  apiKey?: string;
}

export interface KitConfig {
  type: string;
  flows: {
    "prd-copilot": FlowConfig;
  };
  api: ApiConfig;
}

export const config: KitConfig = {
  type: "atomic",
  flows: {
    "prd-copilot": {
      name: "PRD Copilot",
      type: "graphQL",
      workflowId: process.env.PRD_COPILOT_FLOW_ID,
      description: "Draft and refine a Product Requirement Document (PRD) and generate a Mermaid flowchart",
      expectedOutput: ["answer"],
      inputSchema: {
        mode: "string",
        instructions: "string",
        answers: "string"
      },
      outputSchema: {
        answer: "string"
      },
      mode: "sync",
      polling: "false"
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
};

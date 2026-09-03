export type LamaticFlowConfig = {
  name: string;
  type: string;
  workflowId: string | undefined;
  description: string;
  expectedOutput: string[];
  question: string;
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  mode: string;
  polling: boolean;
};

export type LamaticConfig = {
  api: {
    endpoint: string | undefined;
    projectId: string | undefined;
    apiKey: string | undefined;
  };
  flows: {
    "ride-hailing-text-to-sql": LamaticFlowConfig;
  };
};

const config: LamaticConfig = {
  flows: {
    "ride-hailing-text-to-sql": {
      name: "Ride-Hailing Text-to-SQL Analytics Assistant",
      type: "graphQL",
      workflowId: process.env.LAMATIC_FLOW_ID,
      description:
        "Generates a validated read-only SQL query from a natural-language question, executes it, and returns a summarized answer with chart-ready results. Uses session-scoped memory to support conversational follow-ups.",
      expectedOutput: ["answer", "chartType", "sql", "results"],
      question: "string",
      inputSchema: {
        sessionId: "string",
      },
      outputSchema: {
        answer: "string",
        chartType: "string",
        sql: "string",
        results: "array",
      },
      mode: "sync",
      polling: false,
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};

export default config;
export const config = {
  type: "atomic",
  flows: {
    calibrate_scorecard: {
      name: "Calibrate Scorecard",
      type: "graphQL",
      workflowId: process.env.CALIBRATE_SCORECARD_FLOW_ID,
      description:
        "Synthesizes multi-interviewer feedback into a calibrated hiring scorecard.",
      inputSchema: {
        job_title: "string",
        level: "string",
        rubric: "string",
        interviewer_notes: "string",
      },
      outputSchema: {
        scorecard: "object",
        brief: "string",
      },
      mode: "sync",
      polling: "false",
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
};

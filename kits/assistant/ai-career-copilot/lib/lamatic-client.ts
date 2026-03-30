import axios from "axios";

const endpoint = process.env.LAMATIC_API_URL!;
const apiKey = process.env.LAMATIC_API_KEY!;
const projectId = process.env.LAMATIC_PROJECT_ID!;
const flowId = process.env.LAMATIC_FLOW_ID!;

export const lamaticClient = {
  async executeCareerAnalysis(input: {
    resume_text: string;
    domain: string;
  }) {
    const query = `
      query ExecuteWorkflow(
        $workflowId: String!
        $resume_text: String
        $domain: String
      ) {
        executeWorkflow(
          workflowId: $workflowId
          payload: {
            resume_text: $resume_text
            domain: $domain
          }
        ) {
          status
          result
        }
      }
    `;

    const variables = {
      workflowId: flowId,
      resume_text: input.resume_text,
      domain: input.domain,
    };

    const res = await axios.post(
      endpoint,
      { query, variables },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "x-project-id": projectId,
        },
      }
    );

    if (res.data.errors) {
      throw new Error(JSON.stringify(res.data.errors));
    }

    return res.data.data.executeWorkflow.result;
  },
};
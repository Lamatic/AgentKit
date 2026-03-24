'use server';

import axios from 'axios';

const LAMATIC_API_URL = process.env.LAMATIC_API_URL;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID;
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY;
const FLOW_ID = process.env.SYSTEM_DESIGN_ANALYZER_FLOW_ID;

const query = `
  query ExecuteWorkflow(
    $workflowId: String!
    $system_design: String
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        system_design: $system_design
      }
    ) {
      status
      result
    }
  }
`;

export async function analyzeSystemDesign(systemDesign: string) {
  if (!LAMATIC_API_KEY) {
    throw new Error('LAMATIC_API_KEY is not set');
  }

  if (!FLOW_ID) {
    throw new Error('SYSTEM_DESIGN_ANALYZER_FLOW_ID is not set');
  }

  try {
    const variables = {
      workflowId: FLOW_ID,
      system_design: systemDesign,
    };

    const options = {
      method: 'POST',
      url: LAMATIC_API_URL,
      headers: {
        Authorization: `Bearer ${LAMATIC_API_KEY}`,
        'Content-Type': 'application/json',
        'x-project-id': LAMATIC_PROJECT_ID,
      },
      data: { query, variables },
    };

    const response = await axios(options);

    if (response.data?.errors) {
      throw new Error(response.data.errors[0]?.message || 'GraphQL error');
    }

    const result = response.data?.data?.executeWorkflow;

    return {
      success: true,
      status: result?.status,
      result: result?.result,
    };
  } catch (error) {
    console.error('Error calling Lamatic API:', error);
    throw error;
  }
}

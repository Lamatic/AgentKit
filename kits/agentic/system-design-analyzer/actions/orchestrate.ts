'use server';

import axios from 'axios';

const { LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY, SYSTEM_DESIGN_ANALYZER_FLOW_ID } = process.env;

const query = `
  mutation runFlow($workflowId: String!, $input: JSON!) {
    runFlow(workflowId: $workflowId, input: $input) {
      workflowExecutionId
      status
      result
    }
  }
`;

export async function analyzeSystemDesign(systemDesign: string) {
  if (!LAMATIC_API_KEY) {
    throw new Error('LAMATIC_API_KEY is not set');
  }

  if (!SYSTEM_DESIGN_ANALYZER_FLOW_ID) {
    throw new Error('SYSTEM_DESIGN_ANALYZER_FLOW_ID is not set');
  }

  try {
    const variables = {
      workflowId: SYSTEM_DESIGN_ANALYZER_FLOW_ID,
      input: {
        system_design: systemDesign,
      },
    };

    console.log('Calling Lamatic API with:', {
      url: LAMATIC_API_URL,
      workflowId: SYSTEM_DESIGN_ANALYZER_FLOW_ID,
      systemDesignLength: systemDesign.length,
    });

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

    console.log('API Response:', response.data);

    if (response.data?.errors) {
      const errorMsg = response.data.errors[0]?.message || 'GraphQL error';
      console.error('GraphQL Error:', response.data.errors);
      throw new Error(errorMsg);
    }

    const result = response.data?.data?.runFlow;

    if (!result) {
      console.error('No result in response:', response.data);
      throw new Error('No result received from API');
    }

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

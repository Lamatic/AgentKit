import axios from 'axios';
import type { LamaticWorkflowResponse } from './types';

if (!process.env.LAMATIC_FLOW_ID) {
  throw new Error(
    "[Lamatic] LAMATIC_FLOW_ID environment variable is not set. Please add it to your .env.local file."
  );
}

if (!process.env.LAMATIC_PROJECT_ENDPOINT || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_PROJECT_API_KEY) {
  throw new Error(
    "[Lamatic] Lamatic credentials are not fully set. Please ensure LAMATIC_PROJECT_ENDPOINT, LAMATIC_PROJECT_ID, and LAMATIC_PROJECT_API_KEY are configured in your .env.local file."
  );
}

const LAMATIC_ENDPOINT = process.env.LAMATIC_PROJECT_ENDPOINT!;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID!;
const LAMATIC_API_KEY = process.env.LAMATIC_PROJECT_API_KEY!;
const LAMATIC_FLOW_ID = process.env.LAMATIC_FLOW_ID!;

/**
 * Validates and extracts the response structure from Lamatic API
 * Handles multiple response formats from GraphQL
 */
function validateResponse(data: any): LamaticWorkflowResponse {
  if (!data || typeof data !== 'object') {
    console.log('[v0] Raw response (invalid format):', data);
    throw new Error('[Lamatic] Invalid response format: expected object');
  }

  // Log the raw response for debugging
  console.log('[v0] Raw API response:', JSON.stringify(data, null, 2));

  // Check for GraphQL errors first
  if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    const errorMsg = data.errors
      .map((e: any) => e.message)
      .join('; ');
    throw new Error(`[Lamatic] GraphQL Error: ${errorMsg}`);
  }

  // Try multiple response structure patterns
  let result = null;

  // Pattern 1: GraphQL wrapper with data.data.executeWorkflow
  if (data.data?.executeWorkflow) {
    result = data.data.executeWorkflow;
  }
  // Pattern 2: Direct response object
  else if (data.status || data.result) {
    result = data;
  }
  // Pattern 3: Check if data itself is the result
  else if (typeof data === 'object') {
    result = data;
  }

  if (!result) {
    throw new Error('[Lamatic] Could not extract result from response');
  }

  // Provide default status if missing
  const response: LamaticWorkflowResponse = {
    status: result.status || 'completed',
    result: result.result || result.data || result.output,
    message: result.message,
    error: result.error,
    data: result,
  };

  return response;
}

export const lamaticClient = {
  async executeFlow(flowId: string, payload: Record<string, any>): Promise<LamaticWorkflowResponse> {
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

    const variables = {
      workflowId: flowId,
      system_design: payload.system_design,
    };

    try {
      console.log('[v0] Executing flow:', { flowId, inputLength: payload.system_design?.length });

      const response = await axios.post(
        LAMATIC_ENDPOINT,
        { query, variables },
        {
          headers: {
            'Authorization': `Bearer ${LAMATIC_API_KEY}`,
            'Content-Type': 'application/json',
            'x-project-id': LAMATIC_PROJECT_ID,
          },
        }
      );

      const validatedResponse = validateResponse(response.data);
      console.log('[v0] Flow execution completed:', { status: validatedResponse.status });
      
      return validatedResponse;
    } catch (error: any) {
      // Handle GraphQL errors
      if (error.response?.data?.errors) {
        const errorMsg = error.response.data.errors
          .map((e: any) => e.message)
          .join('; ');
        console.error('[v0] GraphQL Error:', {
          message: errorMsg,
          endpoint: LAMATIC_ENDPOINT.split('/').slice(0, 3).join('/'),
        });
        throw new Error(`[Lamatic] GraphQL Error: ${errorMsg}`);
      }
      
      // Handle standard HTTP errors
      const errorMsg = error.response?.data?.message || 
                      error.message || 
                      'Unknown error';
      console.error('[v0] API Error:', {
        status: error.response?.status,
        message: errorMsg,
        endpoint: LAMATIC_ENDPOINT.split('/').slice(0, 3).join('/'),
      });
      throw new Error(`[Lamatic] Flow execution failed: ${errorMsg}`);
    }
  },
};

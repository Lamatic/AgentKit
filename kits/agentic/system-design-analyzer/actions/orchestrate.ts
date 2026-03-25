'use server';

import { Lamatic } from 'lamatic';

const { LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY, SYSTEM_DESIGN_ANALYZER_FLOW_ID } = process.env;

const lamaticClient = new Lamatic({
  endpoint: LAMATIC_API_URL || '',
  projectId: LAMATIC_PROJECT_ID || '',
  apiKey: LAMATIC_API_KEY || '',
});

export async function analyzeSystemDesign(systemDesign: string) {
  if (!LAMATIC_API_KEY) {
    throw new Error('LAMATIC_API_KEY is not set');
  }

  if (!SYSTEM_DESIGN_ANALYZER_FLOW_ID) {
    throw new Error('SYSTEM_DESIGN_ANALYZER_FLOW_ID is not set');
  }

  try {
    console.log('Calling Lamatic Flow with:', {
      flowId: SYSTEM_DESIGN_ANALYZER_FLOW_ID,
      systemDesignLength: systemDesign.length,
    });

    const response = await lamaticClient.executeFlow(SYSTEM_DESIGN_ANALYZER_FLOW_ID, {
      system_design: systemDesign,
    });

    console.log('Flow Response:', response);

    const result = response.result || response;

    return {
      success: true,
      status: result?.status || 'completed',
      result: result?.result || result,
    };
  } catch (error) {
    console.error('Error calling Lamatic Flow:', error);
    throw error;
  }
}

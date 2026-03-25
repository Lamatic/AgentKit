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

    // Extract the actual result content from the response
    let resultContent = '';
    
    if (typeof response === 'string') {
      resultContent = response;
    } else if (response?.result) {
      if (typeof response.result === 'string') {
        resultContent = response.result;
      } else if (response.result?.analysis) {
        resultContent = typeof response.result.analysis === 'string' 
          ? response.result.analysis 
          : JSON.stringify(response.result.analysis, null, 2);
      } else if (response.result?.content) {
        resultContent = typeof response.result.content === 'string'
          ? response.result.content
          : JSON.stringify(response.result.content, null, 2);
      } else {
        // Fallback: stringify the entire result object
        resultContent = JSON.stringify(response.result, null, 2);
      }
    } else {
      resultContent = JSON.stringify(response, null, 2);
    }

    return {
      success: true,
      status: 'completed',
      result: resultContent,
    };
  } catch (error) {
    console.error('Error calling Lamatic Flow:', error);
    throw error;
  }
}

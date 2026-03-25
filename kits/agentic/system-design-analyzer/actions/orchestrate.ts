'use server';

import { lamaticClient } from '@/lib/lamatic-client';

const { SYSTEM_DESIGN_ANALYZER_FLOW_ID } = process.env;

export async function analyzeSystemDesign(systemDesign: string) {
  if (!SYSTEM_DESIGN_ANALYZER_FLOW_ID) {
    throw new Error('SYSTEM_DESIGN_ANALYZER_FLOW_ID is not set');
  }

  try {
    console.log('[Lamatic SDK] Executing flow:', {
      flowId: SYSTEM_DESIGN_ANALYZER_FLOW_ID,
      designLength: systemDesign.length,
      timestamp: new Date().toISOString(),
    });

    const response = await lamaticClient.executeFlow(SYSTEM_DESIGN_ANALYZER_FLOW_ID, {
      system_design: systemDesign,
    });

    console.log('[Lamatic SDK] Response received:', {
      status: response?.status,
      timestamp: new Date().toISOString(),
    });

    if (!response) {
      throw new Error('No response received from flow execution');
    }

    // Extract result content - handle various response formats
    let resultContent = '';
    
    if (typeof response.result === 'string') {
      resultContent = response.result;
    } else if (typeof response.result === 'object' && response.result !== null) {
      resultContent = JSON.stringify(response.result, null, 2);
    } else if (response.result) {
      resultContent = String(response.result);
    } else {
      // If no result field, stringify the entire response
      resultContent = JSON.stringify(response, null, 2);
    }

    return {
      success: true,
      status: response.status || 'completed',
      result: resultContent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Lamatic SDK] Error:', errorMessage);
    throw new Error(`Failed to analyze system design: ${errorMessage}`);
  }
}

'use server';

import { lamaticClient } from '@/lib/lamatic-client';
import type { ServerActionResponse, SystemDesignAnalysis } from '@/lib/types';

const { LAMATIC_FLOW_ID } = process.env;

export async function analyzeSystemDesign(
  systemDesign: string
): Promise<ServerActionResponse<SystemDesignAnalysis>> {
  if (!LAMATIC_FLOW_ID) {
    throw new Error('[Server] LAMATIC_FLOW_ID is not set in environment variables');
  }

  if (!systemDesign || systemDesign.trim().length === 0) {
    throw new Error('[Server] System design input cannot be empty');
  }

  try {
    console.log('[v0] Executing flow:', {
      flowId: LAMATIC_FLOW_ID,
      inputLength: systemDesign.length,
      timestamp: new Date().toISOString(),
    });

    const response = await lamaticClient.executeFlow(LAMATIC_FLOW_ID, {
      system_design: systemDesign,
    });

    console.log('[v0] Flow response received:', { status: response?.status });

    if (!response) {
      throw new Error('[Flow] No response received from flow execution');
    }

    // Check if the flow returned an error
    if (response.status === 'error') {
      const errorDetails = response.error || response.message || 'Unknown error from flow';
      console.error('[v0] Flow error:', errorDetails);
      throw new Error(`[Flow] Execution failed: ${errorDetails}`);
    }

    // Validate and parse result
    let analysisResult: SystemDesignAnalysis = {};
    
    if (typeof response.result === 'string') {
      try {
        analysisResult = JSON.parse(response.result);
      } catch {
        // If not JSON, treat as summary text
        analysisResult = { summary: { nextSteps: [response.result] } };
      }
    } else if (typeof response.result === 'object' && response.result !== null) {
      analysisResult = response.result as SystemDesignAnalysis;
    }

    console.log('[v0] Analysis completed successfully');

    return {
      success: true,
      status: response.status || 'completed',
      result: analysisResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[v0] Analysis failed:', errorMessage);
    
    // Handle specific flow configuration issues
    let userFriendlyError = errorMessage;
    
    if (errorMessage.includes('tool call validation failed') || 
        errorMessage.includes('attempted to call tool') ||
        errorMessage.includes('Instructor Agent')) {
      userFriendlyError = 
        'The flow is configured with Instructor Agents that require specific tools to be available. ' +
        'Please update the flow in Lamatic Studio: Change node types from InstructorLLMNode to LLMNode, ' +
        'or disable structured output mode to allow direct text generation.';
      console.error('[v0] Flow configuration issue detected: Tool-calling nodes without available tools');
    }
    
    return {
      success: false,
      status: 'error',
      error: userFriendlyError,
    };
  }
}

'use server';

import { executeCareerAnalysis } from '@/lib/lamatic-client';
import { CareerAnalysisInput, ApiResponse, CareerAnalysisOutput } from '@/types';

export async function analyzeCareer(
  input: CareerAnalysisInput
): Promise<ApiResponse> {
  try {
    console.log('🚀 Analyzing career with input:', {
      resumeLength: input.resume_text?.length,
      domain: input.domain,
    });

    // ✅ Validation
    if (!input.resume_text?.trim()) {
      return { success: false, error: 'Resume text is required' };
    }

    if (!input.domain?.trim()) {
      return { success: false, error: 'Target domain is required' };
    }

    const result = await executeCareerAnalysis(input);

    return {
      success: true,
      data: result , 
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Career analysis error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to analyze career data.',
    };
  }
}
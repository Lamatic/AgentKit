'use server';

import { lamaticClient } from '@/lib/lamatic-client';
import { CareerAnalysisInput, ApiResponse } from '@/types';

export async function analyzeCareer(
  input: CareerAnalysisInput
): Promise<ApiResponse> {
  try {
    console.log('🚀 Analyzing career with input:', {
      resumeLength: input.resume_text?.length,
      domain: input.domain,
    });

    // ✅ Validate input
    if (!input.resume_text || input.resume_text.trim().length === 0) {
      return {
        success: false,
        error: 'Resume text is required',
      };
    }

    if (!input.domain || input.domain.trim().length === 0) {
      return {
        success: false,
        error: 'Target domain is required',
      };
    }

    // ✅ Call Lamatic API (MAIN FIX)
    const result = await lamaticClient.executeCareerAnalysis({
      resume_text: input.resume_text,
      domain: input.domain,
    });

    // ✅ Return success response
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('❌ Career analysis error:', error);

    let errorMessage =
      'Failed to analyze career data. Please check your configuration.';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
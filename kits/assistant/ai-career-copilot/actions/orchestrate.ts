'use server';

import { lamaticClient } from '@/lib/lamatic-client';
import { CareerAnalysisInput, CareerAnalysisOutput, ApiResponse } from '@/types';

export async function analyzeCareer(
  input: CareerAnalysisInput
): Promise<ApiResponse> {
  try {
    console.log('🚀 Analyzing career with input:', {
      resumeLength: input.resume_text?.length,
      domain: input.domain
    });

    // Validate input
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

    let result;
    let lastError;

    // Try the main mutation first
    try {
      console.log('📡 Trying main GraphQL mutation...');
      result = await lamaticClient.executeCareerAnalysis({
        resume_text: input.resume_text,
        domain: input.domain,
      });
      console.log('✅ Main mutation succeeded!');
    } catch (error) {
      lastError = error;
      console.log('⚠️ Main mutation failed, trying alternative...');
      
      // Try alternative mutation
      try {
        result = await lamaticClient.executeAlternativeMutation({
          resume_text: input.resume_text,
          domain: input.domain,
        });
        console.log('✅ Alternative mutation succeeded!');
      } catch (altError) {
        console.log('⚠️ Alternative mutation failed, trying specific mutation...');
        
        // Try specific mutation
        try {
          result = await lamaticClient.executeWithSpecificMutation({
            resume_text: input.resume_text,
            domain: input.domain,
          });
          console.log('✅ Specific mutation succeeded!');
        } catch (specificError) {
          console.error('❌ All mutations failed');
          throw lastError;
        }
      }
    }

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Career analysis error:', error);
    
    let errorMessage = 'Failed to analyze career data. Please check your configuration.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}
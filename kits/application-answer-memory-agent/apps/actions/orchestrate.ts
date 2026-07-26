'use server';

import { draftAnswer } from '@/lib/lamatic-client';
import { DraftAnswerInput, ApiResponse } from '@/types';
import kitConfig from '../../lamatic.config';

const flowStep = kitConfig.steps.find(
  (step) => step.id === 'application-answer-memory-agent'
);

export async function generateDraftAnswer(
  input: DraftAnswerInput
): Promise<ApiResponse> {
  try {
    if (!flowStep) {
      return {
        success: false,
        error: 'Kit misconfigured: flow step not found in lamatic.config.',
      };
    }

    if (!input.new_question?.trim()) {
      return { success: false, error: 'The new question is required.' };
    }

    if (!input.past_answers?.trim()) {
      return {
        success: false,
        error: 'Paste at least one past answer for the agent to draw from.',
      };
    }

    const result = await draftAnswer(input);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Draft answer error:', error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to draft an answer. Please try again.',
    };
  }
}

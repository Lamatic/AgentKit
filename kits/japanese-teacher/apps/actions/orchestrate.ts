// apps/actions/orchestrate.ts
"use server"

import { lamaticClient } from "../lib/lamatic-client"

const workflowEnvKeys = {
  lesson: "JAPANESE_TEACHER_LESSON_FLOW_ID",
  quiz: "JAPANESE_TEACHER_QUIZ_FLOW_ID",
} as const;

// Helper to securely get the flow ID from the environment.
function getWorkflowId(stepId: string): string {
  const envKey = workflowEnvKeys[stepId as keyof typeof workflowEnvKeys];

  if (!envKey || !process.env[envKey]) {
    throw new Error(`Missing workflow ID for step: ${stepId}. Please check your environment variables.`);
  }

  return process.env[envKey] as string;
}
// ---------------------------------------------------------
// FLOW 1: Generate Text/Context
// ---------------------------------------------------------
export async function generateTextContext(
  level: string,
  context: string,
  words: string[]
) {
  try {
    const query = `
      query ExecuteWorkflow($workflowId: String!, $context: String, $level: String, $words: [String]) {
        executeWorkflow(
          workflowId: $workflowId
          payload: { context: $context, level: $level, words: $words }
        ) {
          status
          result
        }
      }`;

    const variables = {
      workflowId: getWorkflowId("lesson"),
      level,
      context,
      words
    };

    const response = await lamaticClient.executeGraphQL(query, variables);
    return { success: true, data: response.result };

  } catch (error: unknown) {
    console.error("Text Generation Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------
// FLOW 2: Generate Questions
// ---------------------------------------------------------
export async function generateQuestions(
  level: string,
  storyContext: string,
  text: string,
  questionNumber: number,
  counts: { grammar: number; vocabulary: number; context: number; kanji: number }
) {
  try {
    const query = `
      query ExecuteWorkflow(
        $workflowId: String!
        $level: String
        $context: String
        $question_number: Int
        $grammar: Int
        $vocabulary: Int
        $q_context: Int
        $kanji: Int
        $text: String        
      ) {
        executeWorkflow(
          workflowId: $workflowId
          payload: {
            level: $level
            context: $context
            question_number: $question_number
            question_counts: {
              grammar: $grammar
              vocabulary: $vocabulary
              context: $q_context
              kanji: $kanji
            }    
            text: $text
          }
        ) {
            status
            result
        }
      }`;

    const variables = {
      workflowId: getWorkflowId("quiz"),
      level,
      context: storyContext,
      question_number: questionNumber,
      grammar: counts.grammar,
      vocabulary: counts.vocabulary,
      q_context: counts.context, 
      kanji: counts.kanji,
      text
    };

    const response = await lamaticClient.executeGraphQL(query, variables);
    return { success: true, data: response.result };

  } catch (error: unknown) {
    console.error("Question Generation Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
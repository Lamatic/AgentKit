// apps/actions/orchestrate.ts
"use server"

import { lamaticClient } from "../lib/lamatic-client"

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
      workflowId: "d270b86a-d948-440b-b523-45b6ee4af49a",
      level,
      context,
      words
    };

    const response = await lamaticClient.executeGraphQL(query, variables);
    return { success: true, data: response.result };

  } catch (error: any) {
    console.error("Text Generation Error:", error);
    return { success: false, error: error.message };
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
    // Note: I renamed the second $context to $q_context to prevent GraphQL naming collisions
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
      workflowId: "62ca9b42-7242-4521-bf11-9439d10faeff",
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

  } catch (error: any) {
    console.error("Question Generation Error:", error);
    return { success: false, error: error.message };
  }
}
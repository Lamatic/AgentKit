"use server";

import { executeDecisionPremortem } from "@/lib/lamatic-client";
import { premortemInputSchema, premortemResultSchema } from "@/lib/schema";
import type { PremortemInput, PremortemResult } from "@/lib/types";

export async function analyzeDecision(
  input: PremortemInput,
): Promise<
  | { success: true; data: PremortemResult }
  | { success: false; error: string }
> {
  const validatedInput = premortemInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { success: false, error: validatedInput.error.issues[0]?.message ?? "Check the decision details." };
  }

  try {
    const result = await executeDecisionPremortem(validatedInput.data);
    const validatedResult = premortemResultSchema.safeParse(result);
    if (!validatedResult.success) {
      throw new Error("The flow returned an unexpected result shape.");
    }
    return { success: true, data: validatedResult.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed.";
    return { success: false, error: message };
  }
}

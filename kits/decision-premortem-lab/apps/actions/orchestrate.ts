"use server";

import { executeDecisionPremortem } from "@/lib/lamatic-client";
import { premortemInputSchema, premortemResultSchema } from "@/lib/schema";
import type { PremortemInput, PremortemResult } from "@/lib/types";
import lamaticConfig from "../../lamatic.config";

export async function analyzeDecision(
  input: PremortemInput,
): Promise<
  | { success: true; data: PremortemResult }
  | { success: false; error: string }
> {
  const validatedInput = premortemInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return {
      success: false,
      error: validatedInput.error.issues[0]?.message ?? "Check the decision details.",
    };
  }

  try {
    const flowStep = lamaticConfig.steps.find(
      (step) => step.id === "decision-premortem-lab",
    );
    if (!flowStep?.envKey) {
      throw new Error("Decision pre-mortem flow configuration is invalid.");
    }
    const result = await executeDecisionPremortem(
      validatedInput.data,
      flowStep.envKey,
    );
    const validatedResult = premortemResultSchema.safeParse(result);
    if (!validatedResult.success) {
      throw new Error("The flow returned an unexpected result shape.");
    }
    return { success: true, data: validatedResult.data };
  } catch (error) {
    console.error("Decision pre-mortem analysis failed.", error);
    return {
      success: false,
      error: "The pre-mortem could not be generated. Please try again.",
    };
  }
}

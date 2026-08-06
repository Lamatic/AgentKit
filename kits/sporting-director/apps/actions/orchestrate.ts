"use server";

import { lamatic, FLOW_ID } from "@/lib/lamatic-client";

export type ScoutResult = {
  report: string;
};

export type ScoutActionResult =
  | { success: true; data: ScoutResult }
  | { success: false; error: string };

export async function generateReport(
  playerName: string,
  buyingClub: string,
  budget: string,
  needs: string
): Promise<ScoutActionResult> {
  if (
    !playerName.trim() ||
    !buyingClub.trim() ||
    !budget.trim() ||
    !needs.trim()
  ) {
    return {
      success: false,
      error: "Player name, buying club, budget, and club needs are required"
    }
  }

  try {
    const response = await lamatic.executeFlow(FLOW_ID, {
      playerName,
      buyingClub,
      budget,
      needs,
    });

    if (response.status !== "success") {
      return {
        success: false,
        error:
          typeof response.message === "string" && response.message
            ? response.message
            : "The workflow could not process this request.",
      };
    }

    if (!response.result) {
      return { success: false, error: "The workflow returned no result." };
    }

    const raw = response.result as { report?: string };
    if (!raw.report || !raw.report.trim()){
      return { success: false, error: "The workflow returned an empty report."};
    }
    return { success: true, data: { report: raw.report }};
      
  } catch {
    console.error("generateReport failed while executing the Lamatic workflow.");
    return {
      success: false,
      error: "Could not reach the Lamatic workflow. Please try again.",
    };
  }
}
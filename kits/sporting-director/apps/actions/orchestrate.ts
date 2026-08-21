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
  
  const requiredValues = [playerName, buyingClub, budget, needs];
  if (
    requiredValues.some(
      (value) => typeof value !== "string" || !value.trim()
    )
  ) {
    return {
      success: false,
      error: "Player name, buying club, budget, and club needs are required"
    }
  }

  const MAX_LENGTHS = {
    playerName: 100,
    buyingClub: 100,
    budget: 50,
    needs: 500,
  } as const;

  const limitsExceeded =
    playerName.length > MAX_LENGTHS.playerName ||
    buyingClub.length > MAX_LENGTHS.buyingClub ||
    budget.length > MAX_LENGTHS.budget ||
    needs.length > MAX_LENGTHS.needs;

  if (limitsExceeded) {
    return {
      success: false,
      error: "One or more inputs exceed the maximum allowed length. Please shorten the player name, buying club, budget, or club needs."
    }
  }

  // Rate/concurrency limiting is enforced by the deployed edge layer
  // (Vercel's built-in protection) for this Next.js app, so no in-process limiter is needed here.
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
"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";
import type { OfferInput, NegotiationResult } from "@/lib/types";

/**
 * Runs the Offer Negotiator flow: sends the offer to Lamatic and returns the
 * structured negotiation brief.
 * @param offer The candidate's offer details.
 * @returns Success with the negotiation result, or a friendly error message.
 */
export async function negotiateOffer(
  offer: OfferInput
): Promise<{ success: boolean; data?: NegotiationResult; error?: string }> {
  try {
    const flow = config.flows.offerNegotiator;
    if (!flow.workflowId) {
      throw new Error("OFFER_NEGOTIATOR flow ID is not set.");
    }

    const resData: any = await lamaticClient.executeFlow(flow.workflowId, offer);

    const answer = resData?.result?.answer;
    if (!answer) {
      throw new Error("No result returned from the negotiation flow.");
    }

    return { success: true, data: answer as NegotiationResult };
  } catch (error) {
    let message = "Something went wrong. Please try again.";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("fetch failed")) {
        message =
          "Network error: could not reach the negotiation service. Check your connection and try again.";
      } else if (message.toLowerCase().includes("api key")) {
        message =
          "Authentication error: check your Lamatic API configuration in .env.local.";
      }
    }
    return { success: false, error: message };
  }
}

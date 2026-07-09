"use server";

import { z } from "zod";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";
import type { OfferInput, NegotiationResult } from "@/lib/types";

/**
 * Mirrors `NegotiationResult`. The flow's code node returns whatever the LLM
 * produced, so the response is parsed rather than trusted.
 */
const negotiationResultSchema = z.object({
  assessment: z.string(),
  leverage: z.array(z.string()).optional(),
  strategy: z
    .object({
      summary: z.string().optional(),
      target_base: z.string().optional(),
      target_total: z.string().optional(),
      approach: z.string().optional(),
    })
    .optional(),
  talking_points: z.array(z.string()).optional(),
  counter_email: z.string(),
  call_script: z.string().optional(),
  risks: z.array(z.string()).optional(),
  assumptions: z.array(z.string()).optional(),
});

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

    const resData = await lamaticClient.executeFlow(flow.workflowId, offer);

    const answer = (resData as { result?: { answer?: unknown } })?.result?.answer;
    if (!answer) {
      throw new Error("No result returned from the negotiation flow.");
    }

    const parsed = negotiationResultSchema.safeParse(answer);
    if (!parsed.success) {
      throw new Error(
        "The negotiation service returned an unexpected response format."
      );
    }

    return { success: true, data: parsed.data };
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

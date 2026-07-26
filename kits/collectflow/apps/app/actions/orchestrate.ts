"use server";

import { lamaticClient } from "@/app/lib/lamatic-client";
import type { Customer } from "@/app/lib/types";

export interface PortfolioSummary {
  customers_analyzed: number;
  total_overdue: number;
  critical_customers: number;
  approval_required_customers: number;
}

export interface RankedQueueItem {
  rank: number;
  customer_id: string;
  customer_name: string;
  priority_score: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  treatment_lane:
    | "IMMEDIATE_ESCALATION"
    | "MANAGER_REVIEW"
    | "DISPUTE_RESOLUTION"
    | "COLLECTOR_FOLLOW_UP"
    | "STANDARD_REMINDER"
    | "MONITOR";
  approval_required: boolean;
  priority_explanation: string;
}

export interface PortfolioIntelligenceResult {
  portfolio_summary: PortfolioSummary;
  ranked_queue: RankedQueueItem[];
}

export interface CustomerStrategyResult {
  next_best_action: string;
  action_summary: string;
  reasoning: string[];
  recommended_channel:
    | "PHONE"
    | "EMAIL"
    | "PHONE_AND_EMAIL"
    | "INTERNAL_REVIEW";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  approval_required: boolean;
  approval_reason: string;
  operational_controls: string[];
  draft_subject: string;
  draft_message: string;
  journey_state:
    | "READY_FOR_OUTREACH"
    | "AWAITING_APPROVAL"
    | "DISPUTE_REVIEW"
    | "PROMISE_MONITORING"
    | "STANDARD_FOLLOW_UP";
  next_follow_up_days: number;
}

type ActionResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

/**
 * Retrieves a required Lamatic workflow ID from the environment.
 * Throws an error if the variable is missing to prevent workflow execution
 * with incomplete configuration.
 */
function getRequiredFlowId(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing workflow ID: ${name}. Add it to apps/.env.local.`);
  }

  return value;
}

/**
 * Converts unknown runtime errors into user-friendly messages that can be
 * displayed in the CollectFlow interface.
 */
function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "An unknown error occurred.";
  }

  if (error.message.includes("fetch failed")) {
    return "Unable to connect to Lamatic. Please try again.";
  }

  if (
    error.message.toLowerCase().includes("api key") ||
    error.message.toLowerCase().includes("unauthorized")
  ) {
    return "Lamatic authentication failed. Check the API credentials.";
  }

  return error.message;
}

/**
 * Executes the Portfolio Intelligence workflow and returns
 * ranked customers with portfolio summary insights.
 */
export async function analyzePortfolio(
  customers: Customer[],
): Promise<ActionResult<PortfolioIntelligenceResult>> {
  try {
    const flowId = getRequiredFlowId("LAMATIC_PORTFOLIO_FLOW_ID");

    const response = await lamaticClient.executeFlow(flowId, {
      portfolio_data: JSON.stringify(customers),
    });

    const result = response?.result as PortfolioIntelligenceResult | undefined;

    if (!result?.portfolio_summary || !Array.isArray(result.ranked_queue)) {
      throw new Error(
        "Portfolio workflow returned an unexpected response structure.",
      );
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Portfolio Intelligence error:", error);

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * Executes the Customer Strategy workflow for a selected customer and
 * returns the AI-generated next best action.
 */
export async function generateCustomerStrategy(
  customer: Customer,
): Promise<ActionResult<CustomerStrategyResult>> {
  try {
    const flowId = getRequiredFlowId("LAMATIC_CUSTOMER_STRATEGY_FLOW_ID");

    const response = await lamaticClient.executeFlow(flowId, {
      customer_data: JSON.stringify(customer),
    });

    const result = response?.result as CustomerStrategyResult | undefined;

    if (
      !result?.next_best_action ||
      !Array.isArray(result.reasoning) ||
      !Array.isArray(result.operational_controls)
    ) {
      throw new Error(
        "Customer Strategy workflow returned an unexpected response structure.",
      );
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Customer Strategy error:", error);

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

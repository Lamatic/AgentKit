"use server";

import { lamatic, FLOW_ID } from "@/lib/lamatic-client";

export type Transaction = {
  date: string;
  merchant: string;
  amount: number;
  category: string;
};

export type ExpenseAnalysis = {
  transactions: Transaction[];
  totalSpent: number;
  insight: string;
};

export type OrchestrateResult =
  | { success: true; data: ExpenseAnalysis }
  | { success: false; error: string };

/**
 * Sends raw transaction text (pasted receipts, bank statement lines, etc.)
 * to the "analyze-expenses" Lamatic flow, which:
 *   1. Extracts + categorizes each transaction (Generate Text node)
 *   2. Generates a friendly budget insight (LLM node)
 *   3. Returns both as structured JSON (API Response node)
 */
export async function analyzeExpenses(
  transactionText: string,
  currency: string = "USD"
): Promise<OrchestrateResult> {
  if (!transactionText.trim()) {
    return { success: false, error: "Please provide some transaction text to analyze." };
  }

  try {
    const response = await lamatic.executeFlow(FLOW_ID, {
      transactionText,
      currency,
    });

    // The flow's API Response node returns { transactions, insight }.
    // `transactions` comes back as a JSON string from the LLM, so we parse it.
    const raw = (response?.result ?? response) as {
      transactions?: string | { transactions: Transaction[]; totalSpent: number };
      insight?: string;
    };

    let parsedTransactions: { transactions: Transaction[]; totalSpent: number };
    try {
      const transactionsField =
        typeof raw.transactions === "string"
          ? JSON.parse(raw.transactions)
          : raw.transactions;
      parsedTransactions = transactionsField;
    } catch {
      return {
        success: false,
        error: "Could not parse the categorized transactions. Please try again.",
      };
    }

    return {
      success: true,
      data: {
        transactions: parsedTransactions.transactions ?? [],
        totalSpent: parsedTransactions.totalSpent ?? 0,
        insight: raw.insight ?? "",
      },
    };
  } catch (err) {
    console.error("analyzeExpenses error:", err);
    return {
      success: false,
      error: "Something went wrong while analyzing your expenses. Please try again.",
    };
  }
}

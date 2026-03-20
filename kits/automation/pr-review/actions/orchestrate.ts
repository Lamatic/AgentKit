"use server";

import { lamatic } from "@/lib/lamatic-client";

export interface ReviewItem {
  severity?: string;
  type?: string;
  file: string;
  line: number;
  description: string;
  code: string;
  fix: string;
}

export interface PRReviewResult {
  summary: string;
  issues: ReviewItem[];
  suggestions: ReviewItem[];
  verdict: "approve" | "needs_changes" | "discuss";
}

export async function reviewPR(prUrl: string): Promise<PRReviewResult> {
  if (!prUrl || !prUrl.includes("github.com")) {
    throw new Error("Please provide a valid GitHub PR URL.");
  }

  const flowId = process.env.PR_REVIEW_FLOW_ID;
  if (!flowId) throw new Error("PR_REVIEW_FLOW_ID is not configured.");

  const response = await lamatic.executeFlow(flowId, { pr_url: prUrl });

  // Response shape: { pr_url: "...", review: { summary, issues, suggestions, verdict } }
  // Try every possible nesting level to find the review object
  const data = response?.result ?? response?.output ?? response;

  // Check if review is nested under a "review" key
  const review = data?.review ?? data;

  if (typeof review === "string") {
    try {
      return JSON.parse(review) as PRReviewResult;
    } catch {
      throw new Error("Could not parse review: " + review);
    }
  }

  if (review?.summary) {
    return review as PRReviewResult;
  }

  throw new Error("Could not find review in response: " + JSON.stringify(response));
}

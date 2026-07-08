"use server";

import { getLamaticClient } from "@/lib/lamatic-client";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Position = { label: string; stance: string };

export type DebateSetup = {
  cleanTopic: string;
  positionA: Position;
  positionB: Position;
  context: string;
};

export type DebateTurn = {
  round: number;
  side: "A" | "B";
  label: string;
  statement: string;
  keyPoint: string;
};

export type DebateVerdict = {
  prosA: string[];
  consA: string[];
  prosB: string[];
  consB: string[];
  strongestArgA: string;
  strongestArgB: string;
  recommendation: string;
  confidence: "low" | "medium" | "high";
  caveats: string[];
};

function requireFlowId(envKey: string): string {
  const id = process.env[envKey];
  if (!id) {
    throw new Error(
      `Missing ${envKey}. Set it in .env.local (see .env.example) after deploying the flow in Lamatic Studio.`
    );
  }
  return id;
}

/**
 * Step 1: turn a raw decision/question into a neutral topic framing plus
 * two clearly opposed positions.
 */
export async function runDebateSetup(
  topic: string
): Promise<ActionResult<DebateSetup>> {
  try {
    if (!topic.trim()) {
      return { success: false, error: "Please describe the decision or question you want debated." };
    }

    const client = getLamaticClient();
    const flowId = requireFlowId("DEBATE_SETUP_FLOW_ID");

    const res = await client.executeFlow(flowId, { topic: topic.trim() });

    if (res.status !== "success" || !res.result) {
      return { success: false, error: res.message || "Could not frame the debate topic. Please try rephrasing it." };
    }

    return { success: true, data: res.result as DebateSetup };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error framing the debate." };
  }
}

/**
 * Step 2: generate one agent's next statement (opening argument or
 * rebuttal) for a given side. Called repeatedly by the client -- once per
 * side per round -- with the accumulated transcript so far.
 */
export async function runDebateRound(params: {
  topic: string;
  position: Position;
  opponentPosition: Position;
  transcript: DebateTurn[];
  round: number;
  side: "A" | "B";
  isRebuttal: boolean;
}): Promise<ActionResult<DebateTurn>> {
  try {
    const client = getLamaticClient();
    const flowId = requireFlowId("DEBATE_ROUND_FLOW_ID");

    const res = await client.executeFlow(flowId, {
      topic: params.topic,
      position: params.position,
      opponentPosition: params.opponentPosition,
      transcript: params.transcript,
      round: params.round,
      isRebuttal: params.isRebuttal,
    });

    if (res.status !== "success" || !res.result) {
      return { success: false, error: res.message || "Could not generate the next argument." };
    }

    const result = res.result as { statement: string; keyPoint: string };

    return {
      success: true,
      data: {
        round: params.round,
        side: params.side,
        label: params.position.label,
        statement: result.statement,
        keyPoint: result.keyPoint,
      },
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error generating this round." };
  }
}

/**
 * Step 3: given the full transcript, synthesize a pros/cons matrix and a
 * final recommendation.
 */
export async function runDebateJudge(params: {
  topic: string;
  positionA: Position;
  positionB: Position;
  transcript: DebateTurn[];
}): Promise<ActionResult<DebateVerdict>> {
  try {
    const client = getLamaticClient();
    const flowId = requireFlowId("DEBATE_JUDGE_FLOW_ID");

    const res = await client.executeFlow(flowId, {
      topic: params.topic,
      positionA: params.positionA,
      positionB: params.positionB,
      transcript: params.transcript,
    });

    if (res.status !== "success" || !res.result) {
      return { success: false, error: res.message || "Could not reach a verdict." };
    }

    return { success: true, data: res.result as DebateVerdict };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error judging the debate." };
  }
}

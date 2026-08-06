"use server";

import { z } from "zod";
import { getLamaticClient } from "@/lib/lamatic-client";
import kitConfig from "../../lamatic.config";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const PositionSchema = z.object({
  label: z.string(),
  stance: z.string(),
});

export type Position = z.infer<typeof PositionSchema>;

const DebateSetupSchema = z.object({
  cleanTopic: z.string(),
  positionA: PositionSchema,
  positionB: PositionSchema,
  context: z.string(),
});

export type DebateSetup = z.infer<typeof DebateSetupSchema>;

const DebateTurnSchema = z.object({
  round: z.number(),
  side: z.enum(["A", "B"]),
  label: z.string(),
  statement: z.string(),
  keyPoint: z.string(),
});

export type DebateTurn = z.infer<typeof DebateTurnSchema>;

const DebateRoundResultSchema = z.object({
  statement: z.string(),
  keyPoint: z.string(),
});

const DebateVerdictSchema = z.object({
  prosA: z.array(z.string()),
  consA: z.array(z.string()),
  prosB: z.array(z.string()),
  consB: z.array(z.string()),
  strongestArgA: z.string(),
  strongestArgB: z.string(),
  recommendation: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  caveats: z.array(z.string()),
});

export type DebateVerdict = z.infer<typeof DebateVerdictSchema>;

/**
 * lamatic.config.ts is the source of truth for which env var holds each
 * step's deployed flow ID. Resolving through the config (instead of
 * hardcoding the env var name at each call site) keeps this file in sync
 * if the config ever changes a step's envKey.
 */
type StepId = (typeof kitConfig.steps)[number]["id"];

function requireFlowId(stepId: StepId): string {
  const step = kitConfig.steps.find((s) => s.id === stepId);
  if (!step) {
    throw new Error(`Unknown step "${stepId}" -- check lamatic.config.ts`);
  }

  const flowId = process.env[step.envKey];
  if (!flowId) {
    throw new Error(
      `Missing ${step.envKey}. Set it in .env.local (see .env.example) after deploying the "${stepId}" flow in Lamatic Studio.`
    );
  }
  return flowId;
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
    const flowId = requireFlowId("debate-setup");

    const res = await client.executeFlow(flowId, { topic: topic.trim() });

    if (res.status !== "success" || !res.result) {
      return { success: false, error: res.message || "Could not frame the debate topic. Please try rephrasing it." };
    }

    const parsed = DebateSetupSchema.safeParse(res.result);
    if (!parsed.success) {
      return { success: false, error: "The debate-setup flow returned an unexpected response shape. Please try again." };
    }

    return { success: true, data: parsed.data };
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
    const flowId = requireFlowId("debate-round");

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

    const parsed = DebateRoundResultSchema.safeParse(res.result);
    if (!parsed.success) {
      return { success: false, error: "The debate-round flow returned an unexpected response shape. Please try again." };
    }

    const turn: DebateTurn = {
      round: params.round,
      side: params.side,
      label: params.position.label,
      statement: parsed.data.statement,
      keyPoint: parsed.data.keyPoint,
    };

    return { success: true, data: turn };
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
    const flowId = requireFlowId("debate-judge");

    const res = await client.executeFlow(flowId, {
      topic: params.topic,
      positionA: params.positionA,
      positionB: params.positionB,
      transcript: params.transcript,
    });

    if (res.status !== "success" || !res.result) {
      return { success: false, error: res.message || "Could not reach a verdict." };
    }

    const parsed = DebateVerdictSchema.safeParse(res.result);
    if (!parsed.success) {
      return { success: false, error: "The debate-judge flow returned an unexpected response shape. Please try again." };
    }

    return { success: true, data: parsed.data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unexpected error judging the debate." };
  }
}

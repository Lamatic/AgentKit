/**
 * SparkTrace — model tiering, as display metadata.
 * ------------------------------------------------------------------
 * The kit's whole cost argument is that a debugging agent does not need
 * one big model, it needs the RIGHT model per step: an expensive planner
 * that decides, and cheap workers that fetch and summarize. This module
 * is the single place that describes that mapping for the UI.
 *
 * IMPORTANT — this is documentation, not dispatch. Nothing here selects
 * a model. Live mode's routing is owned by the five deployed Lamatic
 * flows (see ../../lamatic.config.ts for the step ids and env keys);
 * these strings mirror that configuration so the showcase can explain
 * the architecture without pretending to be it. In demo mode no model
 * of any tier is invoked at all — the deterministic reasoner in
 * lib/demo/demo-reasoner.ts stands in for every row below.
 */

import type { PlannerAction } from "./contracts";

export interface ModelTier {
  /** Flow id as declared in lamatic.config.ts */
  flow: string;
  /** Human label for the role this tier plays in the loop */
  role: string;
  /** Model id the deployed flow is configured with */
  model: string;
  /** Short model label for inline badges */
  shortModel: string;
  /** Why this step earns (or doesn't earn) an expensive model */
  rationale: string;
}

export const PLANNER_TIER: ModelTier = {
  flow: "sparktrace-planner",
  role: "Planner",
  model: "claude-opus-4-8",
  shortModel: "Opus 4.8",
  rationale:
    "Decides the next investigative action every turn from the evidence so far. This is the only genuinely open-ended judgement in the loop, so it is the only step that earns the top tier.",
};

export const REPO_READER_TIER: ModelTier = {
  flow: "sparktrace-repo-reader",
  role: "Repo reader",
  model: "claude-sonnet-5",
  shortModel: "Sonnet 5",
  rationale:
    "Reads pipeline source and extracts the relevant mechanism. Long context and careful reading, but the question is already framed by the planner.",
};

export const QUERY_GEN_TIER: ModelTier = {
  flow: "sparktrace-query-gen",
  role: "Query generator",
  model: "claude-sonnet-5",
  shortModel: "Sonnet 5",
  rationale:
    "Writes read-only diagnostic SQL against a known schema — a constrained translation task, and its output is checked by the deterministic guard before anything runs.",
};

export const ANALYST_TIER: ModelTier = {
  flow: "sparktrace-analyst",
  role: "Analyst",
  model: "claude-haiku-4-5",
  shortModel: "Haiku 4.5",
  rationale:
    "Reads a compacted result digest — never raw rows — and states what it shows. Small, bounded input; the cheapest tier is the correct tier.",
};

export const REPORTER_TIER: ModelTier = {
  flow: "sparktrace-reporter",
  role: "Reporter",
  model: "claude-sonnet-5",
  shortModel: "Sonnet 5",
  rationale:
    "Synthesizes the accumulated evidence chain into a root-cause report a data engineer can act on. Quality of writing matters; novel reasoning does not.",
};

/** Declaration order = the order a reader should meet them. */
export const MODEL_TIERS: ModelTier[] = [
  PLANNER_TIER,
  REPO_READER_TIER,
  QUERY_GEN_TIER,
  ANALYST_TIER,
  REPORTER_TIER,
];

/**
 * Which worker tier a planner decision hands off to. `conclude` ends the
 * loop and hands off to the reporter; the planner's own decision is
 * always PLANNER_TIER and is labeled separately.
 */
export function tierForAction(action: PlannerAction): ModelTier {
  switch (action) {
    case "read_repo":
      return REPO_READER_TIER;
    case "gen_query":
      return QUERY_GEN_TIER;
    case "conclude":
      return REPORTER_TIER;
  }
}

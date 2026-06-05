"use server";

import { executeFlow, unwrap } from "@/lib/lamatic-client";

const INTAKE_FLOW_ID = process.env.INTAKE_FLOW_ID!;
const GENERATE_WEEK_FLOW_ID = process.env.GENERATE_WEEK_FLOW_ID!;
const REPLAN_FLOW_ID = process.env.REPLAN_FLOW_ID!;

type Lang = "pt-BR" | "en";
type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Category = {
  id: string;
  name: string;
  color: string;
  weekly_target_hours?: number;
};

export type FixedCommitment = {
  id: string;
  day: DayOfWeek;
  start: string;
  end: string;
  label: string;
  category_id?: string;
};

export type RecurringGoal = {
  id: string;
  label: string;
  target_hours_per_week: number;
  preferred_days?: DayOfWeek[];
  preferred_time_window?: { start: string; end: string };
  avoid_time_window?: { start: string; end: string };
  min_block_minutes?: number;
  max_block_minutes?: number;
  category_id?: string;
};

export type OneOffEvent = {
  id: string;
  date: string;
  start: string;
  end: string;
  label: string;
  category_id?: string;
};

export type Preferences = {
  earliest_wake?: string;
  latest_sleep?: string;
  lunch_window?: { start: string; end: string };
  no_activity_before?: string;
  no_activity_after?: string;
  deep_work_when?: "morning" | "afternoon" | "evening";
};

export type Block = {
  id: string;
  day: DayOfWeek;
  start: string;
  end: string;
  kind: "fixed" | "goal" | "oneoff" | "sleep" | "meal" | "break";
  label: string;
  category_id?: string;
  source_goal_id?: string;
};

export type UnmetGoal = {
  goal_id: string;
  goal_label: string;
  target_hours: number;
  scheduled_hours: number;
  gap_hours: number;
  reason: string;
};

export type SessionState = {
  language: Lang;
  categories: Category[];
  fixed_commitments: FixedCommitment[];
  recurring_goals: RecurringGoal[];
  oneoff_events: OneOffEvent[];
  preferences: Preferences;
};

export type IntakeResult = {
  language: Lang;
  assistant_message: string;
  is_complete: boolean;
  session_state: SessionState;
  missing_info: string[];
};

export type GenerateWeekResult = {
  week_start_date: string;
  blocks: Block[];
  unmet_goals: UnmetGoal[];
  summary: string;
};

export type ReplanChange =
  | { kind: "slip"; block_id: string; reason?: string }
  | { kind: "new_event"; event: OneOffEvent }
  | { kind: "completed"; block_id: string };

export type ReplanResult = {
  updated_blocks: Block[];
  diff: {
    added: Block[];
    removed: { block_id: string; reason: string }[];
    moved: {
      block_id: string;
      from: { day: DayOfWeek; start: string };
      to: { day: DayOfWeek; start: string };
    }[];
  };
  unmet_goals: UnmetGoal[];
  summary: string;
};

const normalizeDay = (raw: string): DayOfWeek => {
  const lower = raw.toLowerCase();
  if (lower.length >= 3 && ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(lower.slice(0, 3))) {
    return lower.slice(0, 3) as DayOfWeek;
  }
  return lower as DayOfWeek;
};

const normalizeBlocks = (blocks: Block[]): Block[] =>
  blocks.map((b) => ({ ...b, day: normalizeDay(b.day) }));

const normalizeSessionState = (raw: SessionState): SessionState => ({
  ...raw,
  fixed_commitments: raw.fixed_commitments.map((c) => ({ ...c, day: normalizeDay(c.day) })),
});

export async function callIntake(input: {
  message: string;
  today: string;
  session_state?: SessionState | Record<string, never>;
}): Promise<IntakeResult> {
  const raw = await executeFlow<Record<string, unknown>>(INTAKE_FLOW_ID, {
    message: input.message,
    today: input.today,
    session_state: JSON.stringify(input.session_state ?? {}),
  });

  const result: IntakeResult = {
    language: unwrap(raw.language) as Lang,
    assistant_message: unwrap(raw.assistant_message) as string,
    is_complete: unwrap(raw.is_complete) as boolean,
    session_state: unwrap(raw.session_state) as SessionState,
    missing_info: unwrap(raw.missing_info) as string[],
  };
  result.session_state = normalizeSessionState(result.session_state);
  return result;
}

export async function callGenerateWeek(input: {
  week_start_date: string;
  language: Lang;
  categories: Category[];
  fixed_commitments: FixedCommitment[];
  recurring_goals: RecurringGoal[];
  oneoff_events: OneOffEvent[];
  preferences: Preferences;
}): Promise<GenerateWeekResult> {
  const raw = await executeFlow<Record<string, unknown>>(GENERATE_WEEK_FLOW_ID, {
    week_start_date: input.week_start_date,
    language: input.language,
    categories: JSON.stringify(input.categories),
    fixed_commitments: JSON.stringify(input.fixed_commitments),
    recurring_goals: JSON.stringify(input.recurring_goals),
    oneoff_events: JSON.stringify(input.oneoff_events),
    preferences: JSON.stringify(input.preferences),
  });

  return {
    week_start_date: unwrap(raw.week_start_date) as string,
    blocks: normalizeBlocks(unwrap(raw.blocks) as Block[]),
    unmet_goals: unwrap(raw.unmet_goals) as UnmetGoal[],
    summary: unwrap(raw.summary) as string,
  };
}

export async function callReplan(input: {
  current_blocks: Block[];
  language: Lang;
  categories: Category[];
  recurring_goals: RecurringGoal[];
  fixed_commitments: FixedCommitment[];
  preferences: Preferences;
  change: ReplanChange;
}): Promise<ReplanResult> {
  const raw = await executeFlow<Record<string, unknown>>(REPLAN_FLOW_ID, {
    current_blocks: JSON.stringify(input.current_blocks),
    language: input.language,
    categories: JSON.stringify(input.categories),
    recurring_goals: JSON.stringify(input.recurring_goals),
    fixed_commitments: JSON.stringify(input.fixed_commitments),
    preferences: JSON.stringify(input.preferences),
    change: JSON.stringify(input.change),
  });

  return {
    updated_blocks: normalizeBlocks(unwrap(raw.updated_blocks) as Block[]),
    diff: unwrap(raw.diff) as ReplanResult["diff"],
    unmet_goals: unwrap(raw.unmet_goals) as UnmetGoal[],
    summary: unwrap(raw.summary) as string,
  };
}

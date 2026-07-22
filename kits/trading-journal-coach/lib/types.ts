import type { Trade } from "./metrics";

export type { Trade };
export type Severity = "high" | "medium" | "low";

export interface Pattern {
  id: string;
  label: string;
  present: boolean;
  severity: Severity;
  confidence: number;
  evidence: string[];
  metricRefs?: string[];
}

export interface Finding {
  title: string;
  severity: Severity;
  patternId?: string | null;
  evidence: string;
  whatsHappening: string;
  ruleChange: string;
}

export interface Coaching {
  disciplineScore: number;
  scoreRationale: string;
  headline: string;
  findings: Finding[];
  topPriority: string;
  encouragement: string;
}

/** The fields the UI renders. Metrics carries more (see lib/metrics.ts); index signature keeps it open. */
export interface Metrics {
  tradeCount: number;
  insufficientData?: boolean;
  threshold?: number;
  activity?: { spanDays: number; tradesPerMonth: number | null };
  dateRange?: { from: string; to: string };
  performance: {
    wins: number; losses: number; scratches: number; winRate: number;
    netPnl: number; grossProfit: number; grossLoss: number;
    avgWin: number; avgLoss: number;
    payoffRatio: number | null; profitFactor: number | null; expectancyPerTrade: number;
  };
  risk: { maxDrawdown: number; maxDrawdownPct: number; maxWinStreak: number; maxLossStreak: number; currentStreak: number };
  timeOfDay?: Record<string, { count: number; pnl: number }>;
  dayOfWeek?: Record<string, { count: number; pnl: number }>;
  signals?: Record<string, any>;
  equityCurve: { i: number; date: string; cum: number }[];
  [k: string]: any;
}

export interface Analysis {
  status: "ok" | "insufficient_data";
  message?: string;
  metrics: Metrics;
  patterns: Pattern[];
  coaching: Coaching;
  /** true when produced by the local preview engine (flows not connected). */
  mock?: boolean;
}

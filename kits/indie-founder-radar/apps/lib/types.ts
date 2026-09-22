export type VerdictType = 'BUILD' | 'SKIP' | 'UNCLEAR';

export interface MarketReport {
  idea: string;
  painPoints: string[];
  competitorWeaknesses: string[];
  targetAudience: string;
  marketOpportunity: string;
  verdict: VerdictType;
  verdictReason: string;
  rawReport: string;
  timestamp: string;
  latencyMs?: number;
}

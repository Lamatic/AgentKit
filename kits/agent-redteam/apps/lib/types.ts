// Shared data contracts for the Agent Red-Team Harness.
// Locking these means the flows, the server action, and the UI all agree.

export type AttackCategory =
  | "jailbreak"
  | "prompt-injection"
  | "exfiltration"
  | "instruction-override"
  | "pii-extraction"
  | "harmful-content"

export type Severity = "none" | "low" | "medium" | "high" | "critical"

export interface AttackCase {
  /** Stable id for the case. */
  id: string
  category: AttackCategory
  /** Short label for the specific technique, e.g. "DAN / unrestricted persona". */
  technique: string
  /** The adversarial message sent to the agent as the user turn. */
  payload: string
  /** Why this attack matters / what it's probing for. */
  description: string
  /** Severity to report if the guardrail is compromised by this attack. */
  expectedSeverityIfCompromised: Severity
}

export interface JudgeVerdict {
  /** True if the agent's guardrail was broken (complied, leaked, or produced disallowed content). */
  compromised: boolean
  severity: Severity
  reasoning: string
  /** True only if compromised === false. Recomputed app-side for determinism. */
  pass: boolean
}

export interface AttackResult {
  case: AttackCase
  /** The target agent's raw response to the attack payload. */
  response: string
  /** The judge's verdict, or null if the case errored. */
  judge: JudgeVerdict | null
  /** Set when run-target or the judge failed for this case. */
  error?: string
}

export interface CategoryBreakdown {
  category: AttackCategory
  total: number
  passed: number
  /** Percentage 0-100. */
  passRate: number
}

export interface SecurityAggregate {
  results: AttackResult[]
  total: number
  passed: number
  /** Percentage 0-100. */
  passRate: number
  /** Percentage gate threshold the run was measured against. */
  threshold: number
  /** passRate >= threshold. */
  gatePassed: boolean
  byCategory: CategoryBreakdown[]
}

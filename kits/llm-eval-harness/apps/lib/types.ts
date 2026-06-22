// Shared data contracts for the LLM Eval Harness.
// Locking these means the flows, the server action, and the UI all agree.

export interface GoldenCase {
  /** Optional stable id for the case. */
  id?: string
  /** The request/question sent to the system under test. */
  input: string
  /** What a correct/good output must satisfy (used by the judge). */
  criteria: string
  /** Optional ground-truth context or gold answer for the judge. */
  reference?: string
}

export interface JudgeResult {
  faithfulness: number
  relevancy: number
  correctness: number
  /** Average of the three dimensions, one decimal. */
  overall: number
  /** True only if overall >= 3.5 AND faithfulness >= 3 (faithfulness is a veto). */
  pass: boolean
  reasoning: string
}

export interface CaseResult {
  case: GoldenCase
  /** The output produced by the system under test. */
  output: string
  /** The judge's verdict, or null if the case errored. */
  judge: JudgeResult | null
  /** Set when run-target or the judge failed for this case. */
  error?: string
}

export interface RunAggregate {
  results: CaseResult[]
  total: number
  passed: number
  /** Percentage 0-100. */
  passRate: number
  /** Mean overall score across judged cases, one decimal. */
  avgOverall: number
  /** Percentage gate threshold the run was measured against. */
  threshold: number
  /** passRate >= threshold. */
  gatePassed: boolean
}

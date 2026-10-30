/**
 * Post-generation guardrail: checks the LLM's plan against the numbers that
 * were computed in code. The prompt already forbids changing numbers; this
 * verifies it actually happened and tells the user when it did not.
 */

export type PlanForCheck = {
  tank_advice: string;
  recharge_advice: string;
  summary: string;
  cost_estimate: { low_inr: number; high_inr: number };
};

export type CalcForCheck = {
  recommendedTankL: number;
  rechargePit: { needed: boolean; pits: number; diameterM: number };
};

export type PlanCheck = { passed: boolean; issues: string[] };

/** Litre-like figures in text, e.g. "7,500 L", "7500 litres", "7.5 kL", "7,500 लीटर". */
export function extractLitres(text: string): number[] {
  const out: number[] = [];
  const re = /(\d{1,3}(?:[,\s]\d{2,3})+|\d+(?:\.\d+)?)\s*(kL|kl|KL|L\b|l\b|litres?|liters?|लीटर)/g;
  for (const m of text.matchAll(re)) {
    const n = Number(m[1].replace(/[,\s]/g, ""));
    if (!Number.isFinite(n)) continue;
    out.push(/^k/i.test(m[2]) ? n * 1000 : n);
  }
  return out;
}

export function checkPlan(plan: PlanForCheck, calc: CalcForCheck): PlanCheck {
  const issues: string[] = [];

  // 1. The tank advice must state the computed capacity. Other sizes may be mentioned as
  //    alternatives, so only flag when the recommended size never appears (including when
  //    the advice is empty or has no litre figure at all).
  const tankFigures = extractLitres(plan.tank_advice);
  if (!tankFigures.includes(calc.recommendedTankL)) {
    issues.push(
      `The written tank advice does not mention the computed ${calc.recommendedTankL.toLocaleString("en-IN")} L tank. Use the computed size.`,
    );
  }

  // 2. Recharge advice must not be missing when the code says a pit is needed.
  if (calc.rechargePit.needed && plan.recharge_advice.trim().length < 20) {
    issues.push("A recharge pit is needed for the overflow, but the plan gives little recharge guidance.");
  }

  // 3. Cost range must be finite, non-negative and ordered (low <= high).
  const { low_inr, high_inr } = plan.cost_estimate;
  if (
    !Number.isFinite(low_inr) ||
    !Number.isFinite(high_inr) ||
    low_inr < 0 ||
    high_inr < 0 ||
    low_inr > high_inr
  ) {
    issues.push("The cost range is invalid (negative, missing or low above high). Treat the cost as unreliable.");
  }

  return { passed: issues.length === 0, issues };
}

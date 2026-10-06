"use server";

import {
  calculateHarvest,
  summariseRainfall,
  ROOF_LABEL,
  USE_LABEL,
  type HarvestCalc,
  type PrimaryUse,
  type RainfallSummary,
  type RoofType,
} from "@/lib/calc";
import { executeFlow, unwrap } from "@/lib/lamatic-client";
import { fetchDailyRain, geocodeCity, type Place } from "@/lib/rainfall";
import { checkPlan, type PlanCheck } from "@/lib/verify";

export type Language = "en" | "hi";

export type PlannerInput = {
  city: string;
  roofArea: number;
  areaUnit: "m2" | "sqft";
  roofType: RoofType;
  householdSize: number;
  primaryUse: PrimaryUse;
  budgetInr?: number;
  language: Language;
};

export type Plan = {
  summary: string;
  system_type: string;
  tank_advice: string;
  recharge_advice: string;
  components: { name: string; purpose: string }[];
  installation_steps: string[];
  maintenance: { task: string; frequency: string }[];
  cost_estimate: { low_inr: number; high_inr: number; notes: string };
  water_quality: string;
  warnings: string[];
};

export type PlannerResult =
  | {
      ok: true;
      place: Place;
      rainfall: RainfallSummary;
      calc: HarvestCalc;
      plan: Plan | null;
      planCheck?: PlanCheck;
      planError?: string;
    }
  | { ok: false; error: string };

const SQFT_PER_M2 = 10.7639;

function validate(input: PlannerInput): string | null {
  if (!input.city || input.city.trim().length < 2) return "Please enter a city.";
  if (!(input.roofArea > 0) || input.roofArea > 1_000_000) return "Please enter a valid roof area.";
  if (!(input.householdSize >= 1) || input.householdSize > 500) return "Household size must be between 1 and 500.";
  if (!(input.roofType in ROOF_LABEL)) return "Unknown roof type.";
  if (!(input.primaryUse in USE_LABEL)) return "Unknown primary use.";
  return null;
}

export async function planRainwaterSystem(input: PlannerInput): Promise<PlannerResult> {
  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    // 1. Real rainfall history for the location.
    const place = await geocodeCity(input.city);
    const daily = await fetchDailyRain(place.latitude, place.longitude);
    const rainfall = summariseRainfall(daily);

    // 2. Deterministic engineering maths (no LLM involved).
    const roofAreaM2 = input.areaUnit === "sqft" ? input.roofArea / SQFT_PER_M2 : input.roofArea;
    const calc = calculateHarvest({
      daily,
      roofAreaM2,
      roofType: input.roofType,
      householdSize: input.householdSize,
      primaryUse: input.primaryUse,
    });

    // 3. Lamatic flow turns the numbers into a practical written plan.
    const flowId = process.env.RAINWATER_PLAN_FLOW_ID;
    if (!flowId) {
      return { ok: true, place, rainfall, calc, plan: null, planError: "RAINWATER_PLAN_FLOW_ID is not set." };
    }

    try {
      const location = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
      const raw = await executeFlow(flowId, {
        location,
        roof_type: ROOF_LABEL[input.roofType],
        household_size: String(input.householdSize),
        primary_use: USE_LABEL[input.primaryUse],
        budget_inr: input.budgetInr ? String(input.budgetInr) : "not specified",
        language: input.language === "hi" ? "Hindi" : "English",
        rainfall: JSON.stringify(rainfall),
        calculation: JSON.stringify({ ...calc, tankOptions: undefined }),
      });

      const text = (v: unknown) => {
        const s = unwrap<unknown>(v);
        return typeof s === "string" ? s : "";
      };
      const list = <T,>(v: unknown): T[] => {
        const a = unwrap<unknown>(v);
        return Array.isArray(a) ? (a as T[]) : [];
      };
      const cost = unwrap<Partial<Plan["cost_estimate"]> | string>(raw.cost_estimate);

      const plan: Plan = {
        summary: text(raw.summary),
        system_type: text(raw.system_type),
        tank_advice: text(raw.tank_advice),
        recharge_advice: text(raw.recharge_advice),
        components: list<Plan["components"][number]>(raw.components),
        installation_steps: list<string>(raw.installation_steps),
        maintenance: list<Plan["maintenance"][number]>(raw.maintenance),
        cost_estimate:
          cost && typeof cost === "object"
            ? { low_inr: Number(cost.low_inr) || 0, high_inr: Number(cost.high_inr) || 0, notes: cost.notes ?? "" }
            : { low_inr: 0, high_inr: 0, notes: "" },
        water_quality: text(raw.water_quality),
        warnings: list<string>(raw.warnings),
      };
      // Guardrail: verify the written plan did not drift from the computed numbers.
      const planCheck = checkPlan(plan, calc);
      return { ok: true, place, rainfall, calc, plan, planCheck };
    } catch (err) {
      // The numbers are still useful even if the AI plan fails.
      const message = err instanceof Error ? err.message : "Unknown error";
      return { ok: true, place, rainfall, calc, plan: null, planError: message };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return { ok: false, error: message };
  }
}

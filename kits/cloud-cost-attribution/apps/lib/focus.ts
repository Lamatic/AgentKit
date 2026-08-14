import type { FocusRow } from "./types";

// FOCUS 1.4 renamed a handful of 1.0 columns. We accept either on input and
// normalize to 1.4 names internally — everything downstream sees FocusRow only.
const RENAME_1_0_TO_1_4: Record<string, string> = {
  ProviderName: "ServiceProviderName", // not consumed, kept for completeness
  BillingAccountId: "BillingAccountId",
};

const REQUIRED_COLUMNS = [
  "ChargePeriodStart",
  "ChargePeriodEnd",
  "BillingCurrency",
  "EffectiveCost",
  "BilledCost",
  "ChargeCategory",
  "ChargeDescription",
  "ServiceName",
  "ServiceCategory",
  "RegionId",
  "SubAccountId",
  "PricingQuantity",
  "PricingUnit",
] as const;

export class FocusValidationError extends Error {
  constructor(public missing: string[]) {
    super(`FOCUS row missing required columns: ${missing.join(", ")}`);
    this.name = "FocusValidationError";
  }
}

/** Normalizes a raw parsed-CSV record (1.0 or 1.4 column names) into a FocusRow. */
export function normalizeFocusRecord(raw: Record<string, string>): FocusRow {
  const rec: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const mapped = RENAME_1_0_TO_1_4[k] ?? k;
    rec[mapped] = v;
  }

  const missing = REQUIRED_COLUMNS.filter((c) => rec[c] === undefined || rec[c] === "");
  if (missing.length > 0) {
    throw new FocusValidationError(missing);
  }

  const effectiveCost = Number(rec.EffectiveCost);
  const billedCost = Number(rec.BilledCost);
  const pricingQuantity = Number(rec.PricingQuantity);
  if (!Number.isFinite(effectiveCost) || !Number.isFinite(billedCost) || !Number.isFinite(pricingQuantity)) {
    throw new FocusValidationError(
      ["EffectiveCost", "BilledCost", "PricingQuantity"].filter((c) => {
        const v = Number(rec[c]);
        return !Number.isFinite(v);
      }),
    );
  }

  return {
    ChargePeriodStart: rec.ChargePeriodStart,
    ChargePeriodEnd: rec.ChargePeriodEnd,
    BillingCurrency: rec.BillingCurrency,
    EffectiveCost: effectiveCost,
    BilledCost: billedCost,
    ChargeCategory: rec.ChargeCategory,
    ChargeDescription: rec.ChargeDescription,
    ServiceName: rec.ServiceName,
    ServiceCategory: rec.ServiceCategory,
    RegionId: rec.RegionId,
    SubAccountId: rec.SubAccountId,
    ResourceId: rec.ResourceId || undefined,
    ResourceType: rec.ResourceType || undefined,
    SkuId: rec.SkuId || undefined,
    PricingQuantity: pricingQuantity,
    PricingUnit: rec.PricingUnit,
    Tags: rec.Tags || undefined,
  };
}

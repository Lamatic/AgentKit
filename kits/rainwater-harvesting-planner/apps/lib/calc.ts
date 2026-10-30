/**
 * Deterministic rainwater-harvesting maths.
 *
 * Everything numeric in the plan is computed here, in plain code, so the
 * figures are reproducible and never invented by the LLM. The Lamatic flow
 * only receives these results and turns them into a written plan.
 */

export type RoofType = "rcc_concrete" | "metal_sheet" | "clay_tiles" | "asbestos_sheet" | "green_or_thatch";

export type PrimaryUse = "drinking_cooking" | "flushing_cleaning" | "all_domestic" | "recharge_only";

/** Typical runoff coefficients (share of rain that actually reaches the gutter). */
export const RUNOFF_COEFFICIENT: Record<RoofType, number> = {
  metal_sheet: 0.85,
  rcc_concrete: 0.8,
  asbestos_sheet: 0.8,
  clay_tiles: 0.75,
  green_or_thatch: 0.5,
};

export const ROOF_LABEL: Record<RoofType, string> = {
  rcc_concrete: "RCC / concrete (flat)",
  metal_sheet: "Metal / GI sheet",
  clay_tiles: "Clay tiles",
  asbestos_sheet: "Asbestos / cement sheet",
  green_or_thatch: "Green roof / thatch",
};

/** Litres per person per day that the harvested water is meant to cover. */
export const DEMAND_LPCD: Record<PrimaryUse, number> = {
  drinking_cooking: 10,
  flushing_cleaning: 55,
  all_domestic: 135,
  recharge_only: 0,
};

export const USE_LABEL: Record<PrimaryUse, string> = {
  drinking_cooking: "Drinking & cooking (10 L/person/day)",
  flushing_cleaning: "Toilet flushing & cleaning (55 L/person/day)",
  all_domestic: "All household use (135 L/person/day)",
  recharge_only: "Groundwater recharge only (no storage use)",
};

/** Rain below this depth on a day is lost to wetting the roof and first-flush diversion. */
export const FIRST_FLUSH_MM = 1;

export const TANK_SIZES_L = [500, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];

const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const SQFT_PER_M2 = 10.7639;

export type DailyRain = { date: string; mm: number | null };

export type RainfallSummary = {
  years: number[];
  annualRainfallMm: number; // average total rain per year
  monthlyRainfallMm: number[]; // 12 values, average per month
  rainyDaysPerYear: number; // days with >= 2.5 mm (IMD "rainy day" threshold)
  wettestMonth: string;
  driestMonths: string[]; // months averaging < 10 mm
};

export type TankOption = { sizeL: number; reliabilityPct: number; overflowL: number };

/** Gravel/boulder-filled pits hold water only in the voids between stones. */
export const PIT_FILL_POROSITY = 0.4;
export const PIT_DEPTH_M = 2;
export const PIT_MAX_DIAMETER_M = 2;

export type RechargePit = {
  needed: boolean;
  designStormL: number; // runoff of a typical year's wettest day
  excavationM3: number; // total pit volume needed (incl. fill media)
  pits: number;
  diameterM: number; // per pit
  depthM: number;
};

/**
 * Size recharge pit(s) to absorb a typical year's wettest day of runoff.
 * Volume to dig = storm runoff / porosity of the stone fill. Pits are circular,
 * PIT_DEPTH_M deep, and split into several pits once one would exceed PIT_MAX_DIAMETER_M.
 */
export function sizeRechargePit(maxDailyHarvestL: number, annualOverflowL: number): RechargePit {
  if (!(maxDailyHarvestL > 0) || !(annualOverflowL > 0)) {
    return { needed: false, designStormL: Math.round(Math.max(0, maxDailyHarvestL)), excavationM3: 0, pits: 0, diameterM: 0, depthM: 0 };
  }
  const excavationM3 = maxDailyHarvestL / 1000 / PIT_FILL_POROSITY;
  const singlePitM3 = Math.PI * (PIT_MAX_DIAMETER_M / 2) ** 2 * PIT_DEPTH_M;
  const pits = Math.max(1, Math.ceil(excavationM3 / singlePitM3));
  const perPitM3 = excavationM3 / pits;
  const diameterM = Math.ceil(Math.sqrt((4 * perPitM3) / (Math.PI * PIT_DEPTH_M)) * 10) / 10;
  return {
    needed: true,
    designStormL: Math.round(maxDailyHarvestL),
    excavationM3: Math.round(excavationM3 * 10) / 10,
    pits,
    diameterM: Math.max(0.6, diameterM),
    depthM: PIT_DEPTH_M,
  };
}

export type HarvestCalc = {
  roofAreaM2: number;
  runoffCoefficient: number;
  annualHarvestL: number;
  monthlyHarvestL: number[];
  maxDailyHarvestL: number; // average of each year's single wettest day
  dailyDemandL: number;
  annualDemandL: number;
  annualCoveragePct: number; // harvest / demand, capped at 100 (0 if no demand)
  recommendedTankL: number;
  reliabilityPct: number; // % of demand met with the recommended tank
  annualOverflowL: number; // water the tank cannot hold -> send to recharge
  rechargePit: RechargePit;
  tankOptions: TankOption[];
};

const round = (n: number) => Math.round(n);

/** Summarise several years of daily rainfall into averages. */
export function summariseRainfall(daily: DailyRain[]): RainfallSummary {
  const perYear = new Map<number, number>();
  const monthTotals = new Array(12).fill(0);
  let rainyDays = 0;

  for (const d of daily) {
    if (d.mm == null || Number.isNaN(d.mm)) continue;
    const year = Number(d.date.slice(0, 4));
    const month = Number(d.date.slice(5, 7)) - 1;
    perYear.set(year, (perYear.get(year) ?? 0) + d.mm);
    monthTotals[month] += d.mm;
    if (d.mm >= 2.5) rainyDays++;
  }

  const years = [...perYear.keys()].sort();
  const n = Math.max(years.length, 1);
  const monthly = monthTotals.map((t) => t / n);
  const wettestIdx = monthly.indexOf(Math.max(...monthly));

  return {
    years,
    annualRainfallMm: round([...perYear.values()].reduce((a, b) => a + b, 0) / n),
    monthlyRainfallMm: monthly.map(round),
    rainyDaysPerYear: round(rainyDays / n),
    wettestMonth: MONTHS[wettestIdx],
    driestMonths: MONTHS.filter((_, i) => monthly[i] < 10),
  };
}

/** Litres collectable on one day from a given rain depth. */
export function dailyHarvestL(rainMm: number, roofAreaM2: number, coefficient: number): number {
  const effective = Math.max(0, rainMm - FIRST_FLUSH_MM);
  return effective * roofAreaM2 * coefficient; // 1 mm on 1 m² = 1 litre
}

/**
 * Monthly mass balance over an average year, repeated so the tank reaches a
 * steady state. Returns the share of demand met and the water that overflows.
 */
export function simulateTank(monthlyHarvestL: number[], dailyDemandL: number, tankL: number) {
  let storage = 0;
  let met = 0;
  let demanded = 0;
  let overflow = 0;
  const cycles = 3;

  for (let c = 0; c < cycles; c++) {
    for (let m = 0; m < 12; m++) {
      const inflow = monthlyHarvestL[m];
      const demand = dailyDemandL * DAYS_IN_MONTH[m];
      let s = storage + inflow;
      if (s > tankL) {
        if (c === cycles - 1) overflow += s - tankL;
        s = tankL;
      }
      const supplied = Math.min(s, demand);
      s -= supplied;
      if (c === cycles - 1) {
        met += supplied;
        demanded += demand;
      }
      storage = s;
    }
  }

  const reliabilityPct = demanded > 0 ? (met / demanded) * 100 : 100;
  return { reliabilityPct, overflowL: overflow };
}

/** A bigger tank is only "worth it" if each extra 1,000 L adds at least this many points of reliability. */
export const MIN_GAIN_PER_KL = 2;

/**
 * Best-value tank: start small and keep upsizing while each step still buys
 * at least MIN_GAIN_PER_KL percentage points of demand met per extra 1,000 L.
 * Stops early once demand is (almost) fully met.
 */
export function pickBestValueTank(options: TankOption[]): TankOption {
  const sorted = [...options].sort((a, b) => a.sizeL - b.sizeL);
  let chosen = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (chosen.reliabilityPct >= 98) break;
    const next = sorted[i];
    const gainPerKl = (next.reliabilityPct - chosen.reliabilityPct) / ((next.sizeL - chosen.sizeL) / 1000);
    if (gainPerKl < MIN_GAIN_PER_KL) break;
    chosen = next;
  }
  return chosen;
}

export function calculateHarvest(params: {
  daily: DailyRain[];
  roofAreaM2: number;
  roofType: RoofType;
  householdSize: number;
  primaryUse: PrimaryUse;
}): HarvestCalc {
  const { daily, roofAreaM2, roofType, householdSize, primaryUse } = params;
  if (!(roofAreaM2 > 0)) throw new Error("Roof area must be greater than zero.");
  if (!(householdSize >= 1)) throw new Error("Household size must be at least 1.");

  const coefficient = RUNOFF_COEFFICIENT[roofType];
  const monthTotals = new Array(12).fill(0);
  const yearMax = new Map<number, number>();
  const years = new Set<number>();

  for (const d of daily) {
    if (d.mm == null || Number.isNaN(d.mm)) continue;
    const year = Number(d.date.slice(0, 4));
    const month = Number(d.date.slice(5, 7)) - 1;
    const litres = dailyHarvestL(d.mm, roofAreaM2, coefficient);
    monthTotals[month] += litres;
    years.add(year);
    yearMax.set(year, Math.max(yearMax.get(year) ?? 0, litres));
  }

  const n = Math.max(years.size, 1);
  const monthlyHarvestL = monthTotals.map((t) => t / n);
  const annualHarvestL = monthlyHarvestL.reduce((a, b) => a + b, 0);
  const maxDailyHarvestL = [...yearMax.values()].reduce((a, b) => a + b, 0) / n;

  const dailyDemandL = householdSize * DEMAND_LPCD[primaryUse];
  const annualDemandL = dailyDemandL * 365.25;

  const tankOptions: TankOption[] = TANK_SIZES_L.map((sizeL) => {
    const sim = simulateTank(monthlyHarvestL, dailyDemandL, sizeL);
    return { sizeL, reliabilityPct: round(sim.reliabilityPct), overflowL: round(sim.overflowL) };
  });

  let recommended: TankOption;
  if (primaryUse === "recharge_only" || dailyDemandL === 0) {
    // No storage demand: a small settling/buffer tank, everything else goes to recharge.
    recommended = { sizeL: 1000, reliabilityPct: 100, overflowL: round(annualHarvestL) };
  } else {
    recommended = pickBestValueTank(tankOptions);
  }

  return {
    roofAreaM2: round(roofAreaM2),
    runoffCoefficient: coefficient,
    annualHarvestL: round(annualHarvestL),
    monthlyHarvestL: monthlyHarvestL.map(round),
    maxDailyHarvestL: round(maxDailyHarvestL),
    dailyDemandL: round(dailyDemandL),
    annualDemandL: round(annualDemandL),
    annualCoveragePct: annualDemandL > 0 ? Math.min(100, round((annualHarvestL / annualDemandL) * 100)) : 0,
    recommendedTankL: recommended.sizeL,
    reliabilityPct: recommended.reliabilityPct,
    annualOverflowL: recommended.overflowL,
    rechargePit: sizeRechargePit(maxDailyHarvestL, recommended.overflowL),
    tankOptions,
  };
}

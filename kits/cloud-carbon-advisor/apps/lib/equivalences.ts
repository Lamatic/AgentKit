// kgCO2e → relatable framings. Every factor is a fixed, cited divisor; the
// point is to make an abstract tonnage legible, not to add precision.
// Sources: US EPA Greenhouse Gas Equivalencies Calculator, and typical
// long-haul economy per-seat aviation figures.

import type { Equivalences } from "./types";

// kgCO2e attributable to one unit of each activity.
const KG_PER_FLIGHT_LON_NYC = 500; // one economy seat, one-way (~0.5 tCO2e)
const KG_PER_TREE_SEEDLING_10YR = 60; // one seedling grown 10 years (EPA: 0.060 t)
const KG_PER_CAR_MILE = 0.398; // avg US passenger vehicle (EPA)
const KG_PER_SMARTPHONE_CHARGE = 0.00822; // EPA

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function equivalencesFor(emissionsKg: number): Equivalences {
  const kg = Math.max(0, emissionsKg);
  return {
    flightsLondonNewYork: round1(kg / KG_PER_FLIGHT_LON_NYC),
    treeSeedlings10yr: Math.round(kg / KG_PER_TREE_SEEDLING_10YR),
    gasolineCarMiles: Math.round(kg / KG_PER_CAR_MILE),
    smartphoneCharges: Math.round(kg / KG_PER_SMARTPHONE_CHARGE),
  };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateHarvest, dailyHarvestL, pickBestValueTank, simulateTank, sizeRechargePit, summariseRainfall, type DailyRain } from "./calc.ts";

/** Two synthetic years: 10 mm every day in July, dry otherwise. */
function syntheticRain(): DailyRain[] {
  const out: DailyRain[] = [];
  for (const year of [2023, 2024]) {
    for (let m = 1; m <= 12; m++) {
      const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
      for (let d = 1; d <= days; d++) {
        const date = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        out.push({ date, mm: m === 7 ? 10 : 0 });
      }
    }
  }
  return out;
}

test("1 mm on 1 m² is 1 litre, after first-flush loss", () => {
  assert.equal(dailyHarvestL(11, 1, 1), 10); // first 1 mm diverted
  assert.equal(dailyHarvestL(0.5, 100, 0.8), 0); // below first flush
});

test("rainfall summary averages across years", () => {
  const s = summariseRainfall(syntheticRain());
  assert.deepEqual(s.years, [2023, 2024]);
  assert.equal(s.annualRainfallMm, 310);
  assert.equal(s.monthlyRainfallMm[6], 310);
  assert.equal(s.wettestMonth, "Jul");
  assert.equal(s.rainyDaysPerYear, 31);
  assert.equal(s.driestMonths.length, 11);
});

test("annual harvest = area × effective rain × coefficient", () => {
  const c = calculateHarvest({
    daily: syntheticRain(),
    roofAreaM2: 100,
    roofType: "rcc_concrete", // 0.8
    householdSize: 4,
    primaryUse: "drinking_cooking", // 10 L/person/day
  });
  // 31 days × (10 − 1) mm × 100 m² × 0.8 = 22 320 L
  assert.equal(c.annualHarvestL, 22320);
  assert.equal(c.monthlyHarvestL[6], 22320);
  assert.equal(c.dailyDemandL, 40);
  assert.equal(c.maxDailyHarvestL, 720);
});

test("bigger tanks never reduce reliability", () => {
  const monthly = [0, 0, 0, 0, 0, 0, 22320, 0, 0, 0, 0, 0];
  let prev = -1;
  for (const size of [500, 2000, 5000, 10000, 20000]) {
    const { reliabilityPct } = simulateTank(monthly, 40, size);
    assert.ok(reliabilityPct >= prev, `reliability dropped at ${size} L`);
    prev = reliabilityPct;
  }
});

test("best-value tank stops upsizing when extra litres stop paying off", () => {
  const options = [
    { sizeL: 1000, reliabilityPct: 20, overflowL: 0 },
    { sizeL: 2000, reliabilityPct: 30, overflowL: 0 }, // +10 per kL -> upgrade
    { sizeL: 3000, reliabilityPct: 34, overflowL: 0 }, // +4 per kL  -> upgrade
    { sizeL: 5000, reliabilityPct: 36, overflowL: 0 }, // +1 per kL  -> stop
    { sizeL: 10000, reliabilityPct: 40, overflowL: 0 },
  ];
  assert.equal(pickBestValueTank(options).sizeL, 3000);
});

test("best-value tank stops once demand is fully met", () => {
  const options = [
    { sizeL: 1000, reliabilityPct: 80, overflowL: 0 },
    { sizeL: 2000, reliabilityPct: 99, overflowL: 0 },
    { sizeL: 3000, reliabilityPct: 100, overflowL: 0 },
  ];
  assert.equal(pickBestValueTank(options).sizeL, 2000);
});

test("recommended tank comes from the simulated options", () => {
  const c = calculateHarvest({
    daily: syntheticRain(),
    roofAreaM2: 100,
    roofType: "rcc_concrete",
    householdSize: 4,
    primaryUse: "drinking_cooking",
  });
  const match = c.tankOptions.find((t) => t.sizeL === c.recommendedTankL);
  assert.ok(match);
  assert.equal(match.reliabilityPct, c.reliabilityPct);
});

test("recharge-only sends all harvest to recharge", () => {
  const c = calculateHarvest({
    daily: syntheticRain(),
    roofAreaM2: 100,
    roofType: "metal_sheet",
    householdSize: 4,
    primaryUse: "recharge_only",
  });
  assert.equal(c.dailyDemandL, 0);
  assert.equal(c.annualOverflowL, c.annualHarvestL);
});

test("rejects invalid inputs", () => {
  assert.throws(() =>
    calculateHarvest({ daily: [], roofAreaM2: 0, roofType: "clay_tiles", householdSize: 2, primaryUse: "all_domestic" }),
  );
});

test("zero rainfall: no harvest, 0% demand met, no crash", () => {
  const dry: DailyRain[] = syntheticRain().map((d) => ({ ...d, mm: 0 }));
  const c = calculateHarvest({ daily: dry, roofAreaM2: 100, roofType: "rcc_concrete", householdSize: 4, primaryUse: "all_domestic" });
  assert.equal(c.annualHarvestL, 0);
  assert.equal(c.annualCoveragePct, 0);
  assert.equal(c.reliabilityPct, 0);
  assert.equal(c.annualOverflowL, 0);
});

test("missing days (null) are skipped, not treated as zero-crash", () => {
  const withGaps = syntheticRain().map((d, i) => (i % 5 === 0 ? { ...d, mm: null } : d));
  const c = calculateHarvest({ daily: withGaps, roofAreaM2: 50, roofType: "clay_tiles", householdSize: 2, primaryUse: "drinking_cooking" });
  assert.ok(Number.isFinite(c.annualHarvestL) && c.annualHarvestL > 0);
});

test("tiny roof with extreme monsoon still gives sane, bounded results", () => {
  const extreme: DailyRain[] = syntheticRain().map((d) => ({ ...d, mm: d.date.slice(5, 7) === "07" ? 300 : 0 }));
  const c = calculateHarvest({ daily: extreme, roofAreaM2: 2, roofType: "green_or_thatch", householdSize: 1, primaryUse: "drinking_cooking" });
  assert.ok(c.reliabilityPct >= 0 && c.reliabilityPct <= 100);
  assert.ok(c.tankOptions.every((t) => t.overflowL >= 0));
  // 31 days × 299 mm × 2 m² × 0.5
  assert.equal(c.annualHarvestL, 9269);
});

test("recharge pit holds a wettest-day storm in its stone voids", () => {
  const pit = sizeRechargePit(4000, 10000); // 4 m³ of runoff -> 10 m³ to dig
  assert.equal(pit.needed, true);
  assert.equal(pit.excavationM3, 10);
  assert.equal(pit.depthM, 2);
  const dug = pit.pits * Math.PI * (pit.diameterM / 2) ** 2 * pit.depthM;
  assert.ok(dug >= 10, `dug volume ${dug} m³ is too small`);
  assert.ok(pit.diameterM <= 2);
});

test("no pit when there is no overflow", () => {
  assert.equal(sizeRechargePit(4000, 0).needed, false);
});

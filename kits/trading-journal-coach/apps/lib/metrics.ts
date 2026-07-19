/**
 * analyze-journal — deterministic metrics (Studio code node)
 * ----------------------------------------------------------------------------
 * PURE, dependency-free. Give it the parsed `trades` array, it returns a
 * `Metrics` object. In Lamatic Studio, paste the body into the code node and
 * wire `trades` to the trigger output (adapt to Studio's code-node signature).
 *
 * Every number the pattern-detector and coach later cite comes from HERE.
 * The constitution forbids the LLMs from inventing numbers not in this output.
 *
 * Thresholds encode VAIBHAV'S OWN RULES (NSE options):
 *   - one trade per day (win or lose, stop for the day)
 *   - no revenge trades (no re-entry after a loss)
 *   - size off a ₹50,000 account at 1:3 R:R
 *   - cut losers / let winners run (hold asymmetry > 1.5x flags the opposite)
 *   - primary windows: open 09:15–10:00 and close 14:45–15:30
 */

export interface Trade {
  date: string;        // entry datetime, ISO 8601 (IST), e.g. "2026-06-03T09:45:00+05:30"
  symbol: string;
  side: "long" | "short";
  qty: number;         // lots
  entry: number;
  exit: number;
  pnl: number;         // realized ₹ P&L
  notes?: string;
  exitDate?: string;   // optional exit datetime — unlocks hold-time + revenge timing
  fees?: number;
}

export const THRESHOLDS = {
  minTradesForCoaching: 20,   // ≈ one month at ~20 trades/month
  maxTradesPerDay: 1,         // Vaibhav's rule: one-and-done per day
  cooldownMin: 15,            // a same-day re-entry within 15 min = a "hot" revenge
  sizeCreepRatio: 1.25,       // (secondary) avg qty after a loss > 1.25x baseline
  holdAsymmetryRatio: 1.5,    // avg loser hold > 1.5x avg winner hold
  timeLeakMinShare: 0.10,     // a net-losing window needs >=10% of trades to flag
  accountSize: 50000,         // sizing benchmark account (₹)
  rrTarget: 3,                // 1:3 reward:risk
  riskPctPrimary: 1,          // coach anchors on 1% (₹500/trade); 2% also shown
};

// ---- IST wall-clock helpers (tz-robust for durations; explicit for hour/dow) ----
function hasTZ(iso: string): boolean {
  return /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso.trim());
}
function istParts(iso: string) {
  let epoch: number, h: number, min: number, dow: number, dateKey: string;
  if (hasTZ(iso)) {
    const d = new Date(iso);
    epoch = d.getTime();
    const ist = new Date(epoch + 330 * 60000); // shift so getUTC* reads IST wall clock
    h = ist.getUTCHours(); min = ist.getUTCMinutes(); dow = ist.getUTCDay();
    dateKey = ist.toISOString().slice(0, 10);
  } else {
    const m = iso.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) {
      const [, Y, Mo, D, H, Mi] = m;
      h = +H; min = +Mi; dateKey = `${Y}-${Mo}-${D}`;
      dow = new Date(Date.UTC(+Y, +Mo - 1, +D)).getUTCDay();
      epoch = Date.UTC(+Y, +Mo - 1, +D, +H, +Mi);
    } else {
      const d = new Date(iso);
      epoch = isNaN(d.getTime()) ? 0 : d.getTime();
      h = 0; min = 0; dow = 0; dateKey = "unknown";
    }
  }
  return { epoch, hour: h, minute: min, dow, dateKey, tod: h * 60 + min };
}
function todBucket(tod: number): string {
  if (tod < 600) return "open_0915_1000";        // primary window
  if (tod < 690) return "morning_1000_1130";
  if (tod < 810) return "midday_1130_1330";
  if (tod < 885) return "afternoon_1330_1445";
  return "close_1445_1530";                       // primary window
}
const PRIMARY_WINDOWS = ["open_0915_1000", "close_1445_1530"];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const round = (n: number, p = 2) => {
  const f = 10 ** p;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export function computeMetrics(rawTrades: Trade[]) {
  const trades = [...(rawTrades || [])]
    .filter(t => t && isFinite(t.pnl))
    .sort((a, b) => istParts(a.date).epoch - istParts(b.date).epoch);

  const n = trades.length;
  if (n === 0) {
    return { tradeCount: 0, insufficientData: true, threshold: THRESHOLDS.minTradesForCoaching };
  }

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const scratches = trades.filter(t => t.pnl === 0);

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const winRate = n ? wins.length / n : 0;
  const lossRate = n ? losses.length / n : 0;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : null;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
  const expectancy = winRate * avgWin - lossRate * avgLoss;

  // Normalized R (no stop column in v1 → normalize by avg loss; labeled as such)
  const rUnit = avgLoss > 0 ? avgLoss : null;
  const rBuckets: Record<string, number> = {
    "<=-2R": 0, "-2R..-1R": 0, "-1R..0": 0, "0..1R": 0, "1R..2R": 0, "2R..3R": 0, ">3R": 0,
  };
  if (rUnit) for (const t of trades) {
    const r = t.pnl / rUnit;
    if (r <= -2) rBuckets["<=-2R"]++; else if (r < -1) rBuckets["-2R..-1R"]++;
    else if (r < 0) rBuckets["-1R..0"]++; else if (r < 1) rBuckets["0..1R"]++;
    else if (r < 2) rBuckets["1R..2R"]++; else if (r <= 3) rBuckets["2R..3R"]++;
    else rBuckets[">3R"]++;
  }

  // Equity curve + max drawdown
  let cum = 0, peak = 0, maxDD = 0, maxDDPct = 0;
  const equityCurve: { i: number; date: string; cum: number }[] = [];
  trades.forEach((t, i) => {
    cum += t.pnl; peak = Math.max(peak, cum);
    const dd = peak - cum;
    if (dd > maxDD) { maxDD = dd; maxDDPct = peak > 0 ? dd / peak : 0; }
    equityCurve.push({ i, date: t.date, cum: round(cum) });
  });

  // Streaks
  let curW = 0, curL = 0, maxW = 0, maxL = 0;
  for (const t of trades) {
    if (t.pnl > 0) { curW++; curL = 0; maxW = Math.max(maxW, curW); }
    else if (t.pnl < 0) { curL++; curW = 0; maxL = Math.max(maxL, curL); }
    else { curW = 0; curL = 0; }
  }
  const last = trades[n - 1];
  const currentStreak = last.pnl > 0 ? curW : last.pnl < 0 ? -curL : 0;

  // Time-of-day P&L
  const tod: Record<string, { count: number; pnl: number }> = {};
  for (const t of trades) {
    const b = todBucket(istParts(t.date).tod);
    (tod[b] ||= { count: 0, pnl: 0 });
    tod[b].count++; tod[b].pnl += t.pnl;
  }
  Object.values(tod).forEach(v => (v.pnl = round(v.pnl)));
  let worstWindow: string | null = null, worstWindowPnl = 0;
  for (const [k, v] of Object.entries(tod)) {
    if (v.pnl < worstWindowPnl && v.count / n >= THRESHOLDS.timeLeakMinShare) { worstWindowPnl = v.pnl; worstWindow = k; }
  }
  const primaryWindowPnl = round(
    PRIMARY_WINDOWS.reduce((s, w) => s + (tod[w]?.pnl || 0), 0)
  );

  // Day-of-week P&L
  const dow: Record<string, { count: number; pnl: number }> = {};
  for (const t of trades) {
    const d = DOW[istParts(t.date).dow];
    (dow[d] ||= { count: 0, pnl: 0 });
    dow[d].count++; dow[d].pnl += t.pnl;
  }
  Object.values(dow).forEach(v => (v.pnl = round(v.pnl)));

  // Group trade indices by day, preserving time order (basis for the rule signals)
  const dayGroups: Record<string, number[]> = {};
  trades.forEach((t, i) => { const k = istParts(t.date).dateKey; (dayGroups[k] ||= []).push(i); });
  const dayEntries = Object.entries(dayGroups);

  // Rule 1: one trade per day. Extra trades = every non-first trade in a day.
  let extraTrades = 0, pnlOnExtra = 0, daysMultiple = 0;
  // Rule 2: no revenge = no trade after a loss earlier the same day.
  const revengeDetail: { afterTradeIndex: number; dateKey: string; gapMinutes: number; qtyRatio: number; withinCooldown: boolean; pnl: number }[] = [];
  let pnlOnRevenge = 0, hotRevenge = 0;
  for (const [k, idxs] of dayEntries) {
    if (idxs.length > 1) daysMultiple++;
    let lossSeen = false;
    idxs.forEach((gi, pos) => {
      const t = trades[gi];
      if (pos > 0) { extraTrades++; pnlOnExtra += t.pnl; }
      if (lossSeen) {
        const prev = trades[idxs[pos - 1]];
        const from = prev.exitDate ? istParts(prev.exitDate).epoch : istParts(prev.date).epoch;
        const gap = (istParts(t.date).epoch - from) / 60000;
        const withinCooldown = gap >= 0 && gap <= THRESHOLDS.cooldownMin;
        if (withinCooldown) hotRevenge++;
        revengeDetail.push({
          afterTradeIndex: idxs[pos - 1], dateKey: k, gapMinutes: round(gap, 1),
          qtyRatio: prev.qty > 0 ? round(t.qty / prev.qty, 2) : 1, withinCooldown, pnl: round(t.pnl),
        });
        pnlOnRevenge += t.pnl;
      }
      if (t.pnl < 0) lossSeen = true;
    });
  }
  const overtradingDays = dayEntries
    .filter(([, idxs]) => idxs.length > THRESHOLDS.maxTradesPerDay)
    .map(([date, idxs]) => ({ date, count: idxs.length, pnl: round(idxs.reduce((s, i) => s + trades[i].pnl, 0)) }));

  // Sizing benchmark (₹50k, 1:3). Exact lots need a stop column (v1.1).
  const A = THRESHOLDS.accountSize;
  const riskModel = [1, 2].map(pct => ({
    riskPct: pct, riskPerTrade: round(A * pct / 100), targetPerTrade: round(A * pct / 100 * THRESHOLDS.rrTarget),
  }));
  const sizingBenchmark = {
    accountSize: A, rrTarget: `1:${THRESHOLDS.rrTarget}`, riskModel,
    avgActualLoss: round(avgLoss), avgActualWin: round(avgWin),
    avgLossVsBudget1pct: avgLoss > 0 ? round(avgLoss / (A * 0.01), 2) : null,   // >1 = oversized vs 1% budget
    avgLossVsBudget2pct: avgLoss > 0 ? round(avgLoss / (A * 0.02), 2) : null,
    note: "Exact lots = riskPerTrade ÷ (stop points × lot size). Add a stop column for per-trade sizing (v1.1).",
  };

  // Size creep after losses (secondary behavioural signal)
  const baselineQty = trades.reduce((s, t) => s + t.qty, 0) / n;
  const afterLossQtys: number[] = [];
  for (let i = 1; i < n; i++) if (trades[i - 1].pnl < 0) afterLossQtys.push(trades[i].qty);
  const avgQtyAfterLoss = afterLossQtys.length ? afterLossQtys.reduce((s, q) => s + q, 0) / afterLossQtys.length : null;
  const sizeCreepRatio = avgQtyAfterLoss && baselineQty > 0 ? avgQtyAfterLoss / baselineQty : null;

  // Hold-time asymmetry (needs exitDate)
  const holdMin = (t: Trade) => t.exitDate ? (istParts(t.exitDate).epoch - istParts(t.date).epoch) / 60000 : null;
  const winHolds = wins.map(holdMin).filter((x): x is number => x != null && x >= 0);
  const lossHolds = losses.map(holdMin).filter((x): x is number => x != null && x >= 0);
  const avgWinHold = winHolds.length ? winHolds.reduce((s, x) => s + x, 0) / winHolds.length : null;
  const avgLossHold = lossHolds.length ? lossHolds.reduce((s, x) => s + x, 0) / lossHolds.length : null;
  const holdAsymRatio = avgWinHold && avgLossHold && avgWinHold > 0 ? avgLossHold / avgWinHold : null;

  // Activity / cadence
  const spanDays = (istParts(last.date).epoch - istParts(trades[0].date).epoch) / 86400000;
  const tradesPerMonth = spanDays > 0 ? round(n / (spanDays / 30.44), 1) : null;

  const signals = {
    oneTradePerDay: {
      rule: "max 1 trade/day (Vaibhav's rule)",
      tradingDays: dayEntries.length,
      daysWithMultipleTrades: daysMultiple,
      extraTrades, pnlOnExtraTrades: round(pnlOnExtra),
    },
    revenge: {
      rule: "no trade after a loss earlier the same day",
      episodes: revengeDetail.length, hotEpisodesWithin15min: hotRevenge, cooldownMin: THRESHOLDS.cooldownMin,
      pnlOnRevengeTrades: round(pnlOnRevenge), detail: revengeDetail.slice(0, 10),
    },
    overtrading: {
      rule: `> ${THRESHOLDS.maxTradesPerDay} trade/day`,
      days: overtradingDays, netPnlOnThoseDays: round(overtradingDays.reduce((s, d) => s + d.pnl, 0)),
    },
    sizingBenchmark,
    sizeCreep: {
      baselineQty: round(baselineQty, 2), avgQtyAfterLoss: avgQtyAfterLoss != null ? round(avgQtyAfterLoss, 2) : null,
      ratio: sizeCreepRatio != null ? round(sizeCreepRatio, 2) : null,
      exceedsThreshold: sizeCreepRatio != null ? sizeCreepRatio > THRESHOLDS.sizeCreepRatio : null,
    },
    holdAsymmetry: {
      avgWinnerHoldMin: avgWinHold != null ? round(avgWinHold, 1) : null,
      avgLoserHoldMin: avgLossHold != null ? round(avgLossHold, 1) : null,
      ratio: holdAsymRatio != null ? round(holdAsymRatio, 2) : null,
      exceedsThreshold: holdAsymRatio != null ? holdAsymRatio > THRESHOLDS.holdAsymmetryRatio : null,
      available: avgWinHold != null && avgLossHold != null,
    },
    timeLeak: { worstWindow, worstWindowPnl, primaryWindows: PRIMARY_WINDOWS, primaryWindowPnl },
    structure: {
      negativeExpectancy: expectancy < 0,
      poorPayoff: payoffRatio != null ? payoffRatio < 1 : null,
      lowWinRate: winRate < 0.5,
    },
  };

  return {
    generatedAtNote: "All figures deterministic. LLMs must cite only these numbers.",
    insufficientData: n < THRESHOLDS.minTradesForCoaching,
    threshold: THRESHOLDS.minTradesForCoaching,
    tradeCount: n,
    activity: { spanDays: round(spanDays, 1), tradesPerMonth },
    dateRange: { from: trades[0].date, to: last.date },
    performance: {
      wins: wins.length, losses: losses.length, scratches: scratches.length,
      winRate: round(winRate, 4),
      netPnl: round(netPnl), grossProfit: round(grossProfit), grossLoss: round(grossLoss),
      avgWin: round(avgWin), avgLoss: round(avgLoss),
      payoffRatio: payoffRatio != null ? round(payoffRatio, 2) : null,
      profitFactor: profitFactor != null ? round(profitFactor, 2) : null,
      expectancyPerTrade: round(expectancy),
    },
    rMultiples: { unitNote: "R normalized by avg loss (no stop column in v1)", unit: rUnit != null ? round(rUnit) : null, distribution: rBuckets },
    risk: { maxDrawdown: round(maxDD), maxDrawdownPct: round(maxDDPct * 100, 1), maxWinStreak: maxW, maxLossStreak: maxL, currentStreak },
    timeOfDay: tod,
    dayOfWeek: dow,
    sizing: { baselineQty: round(baselineQty, 2), avgQtyAfterLoss: avgQtyAfterLoss != null ? round(avgQtyAfterLoss, 2) : null },
    signals,
    thresholds: THRESHOLDS,
    equityCurve,
  };
}

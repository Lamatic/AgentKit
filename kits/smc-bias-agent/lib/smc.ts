import {
  Candle,
  SwingPoint,
  OrderBlock,
  FairValueGap,
  StructureEvent,
  KeyLevel,
  SMCAnalysis,
  Bias,
} from "./types";

const SWING_LOOKBACK = 2;
const IMPULSE_LOOKAHEAD = 4;
const IMPULSE_MIN_RANGE_MULT = 1.5;

export function findSwingPoints(candles: Candle[], lookback = SWING_LOOKBACK): SwingPoint[] {
  const points: SwingPoint[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const window = candles.slice(i - lookback, i + lookback + 1);
    const isHigh = window.every((c) => c.high <= candles[i].high);
    const isLow = window.every((c) => c.low >= candles[i].low);

    if (isHigh) {
      points.push({ index: i, time: candles[i].time, price: candles[i].high, type: "high" });
    } else if (isLow) {
      points.push({ index: i, time: candles[i].time, price: candles[i].low, type: "low" });
    }
  }

  return points;
}

export function findStructureEvents(candles: Candle[], swings: SwingPoint[]): StructureEvent[] {
  const events: StructureEvent[] = [];
  let trend: Bias = "neutral";
  let lastHigh: SwingPoint | null = null;
  let lastLow: SwingPoint | null = null;

  const swingByIndex = new Map(swings.map((s) => [s.index, s]));

  for (let i = 0; i < candles.length; i++) {
    const swing = swingByIndex.get(i);
    if (swing?.type === "high") lastHigh = swing;
    if (swing?.type === "low") lastLow = swing;

    const close = candles[i].close;

    if (lastHigh && i > lastHigh.index && close > lastHigh.price) {
      const direction: Bias = "bullish";
      const type = trend === "bearish" ? "CHoCH" : "BOS";
      events.push({ type, direction, index: i, time: candles[i].time, brokenLevel: lastHigh.price, breakPrice: close });
      trend = "bullish";
      lastHigh = null; // level consumed, wait for the next one
    } else if (lastLow && i > lastLow.index && close < lastLow.price) {
      const direction: Bias = "bearish";
      const type = trend === "bullish" ? "CHoCH" : "BOS";
      events.push({ type, direction, index: i, time: candles[i].time, brokenLevel: lastLow.price, breakPrice: close });
      trend = "bearish";
      lastLow = null;
    }
  }

  return events;
}

export function findOrderBlocks(candles: Candle[], events: StructureEvent[]): OrderBlock[] {
  const blocks: OrderBlock[] = [];

  for (const event of events) {
    const searchStart = Math.max(0, event.index - IMPULSE_LOOKAHEAD - 3);
    let originIndex = -1;

    for (let i = event.index - 1; i >= searchStart; i--) {
      const c = candles[i];
      const isBearish = c.close < c.open;
      const isBullish = c.close > c.open;

      if (event.direction === "bullish" && isBearish) {
        originIndex = i;
        break;
      }
      if (event.direction === "bearish" && isBullish) {
        originIndex = i;
        break;
      }
    }

    if (originIndex === -1) continue;

    const origin = candles[originIndex];
    const top = Math.max(origin.open, origin.close);
    const bottom = Math.min(origin.open, origin.close);

    let mitigated = false;
    for (let i = event.index + 1; i < candles.length; i++) {
      if (candles[i].low <= top && candles[i].high >= bottom) {
        mitigated = true;
        break;
      }
    }

    blocks.push({
      type: event.direction,
      startIndex: originIndex,
      endIndex: event.index,
      top,
      bottom,
      time: origin.time,
      mitigated,
    });
  }

  return blocks;
}

export function findFairValueGaps(candles: Candle[]): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const next = candles[i + 1];

    if (prev.high < next.low) {
      const gap = { top: next.low, bottom: prev.high };
      gaps.push({
        type: "bullish",
        index: i,
        top: gap.top,
        bottom: gap.bottom,
        time: candles[i].time,
        filled: isFilled(candles, i + 1, gap.bottom, gap.top),
      });
    } else if (prev.low > next.high) {
      const gap = { top: prev.low, bottom: next.high };
      gaps.push({
        type: "bearish",
        index: i,
        top: gap.top,
        bottom: gap.bottom,
        time: candles[i].time,
        filled: isFilled(candles, i + 1, gap.bottom, gap.top),
      });
    }
  }

  return gaps;
}

function isFilled(candles: Candle[], fromIndex: number, bottom: number, top: number): boolean {
  for (let i = fromIndex; i < candles.length; i++) {
    if (candles[i].low <= bottom && candles[i].high >= top) return true;
  }
  return false;
}

function computeBias(
  events: StructureEvent[],
  orderBlocks: OrderBlock[],
  fvgs: FairValueGap[],
  lastPrice: number
): { bias: Bias; confidence: number } {
  if (events.length === 0) return { bias: "neutral", confidence: 15 };

  const last = events[events.length - 1];
  const bias = last.direction;

  let confidence = last.type === "CHoCH" ? 45 : 55;

  const freshOB = orderBlocks.find((ob) => ob.type === bias && !ob.mitigated);
  if (freshOB) confidence += 20;

  const freshFVG = fvgs.find((f) => f.type === bias && !f.filled);
  if (freshFVG) confidence += 15;

  const recentEvents = events.slice(-3);
  const sameDirCount = recentEvents.filter((e) => e.direction === bias).length;
  if (sameDirCount === recentEvents.length && recentEvents.length > 1) confidence += 10;

  return { bias, confidence: Math.min(confidence, 95) };
}

function buildKeyLevels(orderBlocks: OrderBlock[], fvgs: FairValueGap[], events: StructureEvent[]): KeyLevel[] {
  const levels: KeyLevel[] = [];

  const freshOBs = orderBlocks.filter((ob) => !ob.mitigated).slice(-2);
  for (const ob of freshOBs) {
    levels.push({
      label: `${ob.type === "bullish" ? "Bullish" : "Bearish"} order block`,
      detail: "unmitigated",
      low: ob.bottom,
      high: ob.top,
    });
  }

  const freshFVGs = fvgs.filter((f) => !f.filled).slice(-2);
  for (const f of freshFVGs) {
    levels.push({
      label: `${f.type === "bullish" ? "Bullish" : "Bearish"} fair value gap`,
      detail: "unfilled",
      low: f.bottom,
      high: f.top,
    });
  }

  const lastEvent = events[events.length - 1];
  if (lastEvent) {
    levels.push({
      label: lastEvent.type === "CHoCH" ? "Change of character" : "Break of structure",
      detail: lastEvent.direction,
      low: lastEvent.brokenLevel,
      high: lastEvent.brokenLevel,
    });
  }

  return levels;
}

export function analyzeSMC(symbol: string, interval: string, candles: Candle[]): SMCAnalysis {
  if (candles.length < SWING_LOOKBACK * 2 + 3) {
    throw new Error("Not enough candles to run SMC analysis (need at least 7).");
  }

  const swingPoints = findSwingPoints(candles);
  const structureEvents = findStructureEvents(candles, swingPoints);
  const orderBlocks = findOrderBlocks(candles, structureEvents);
  const fvgs = findFairValueGaps(candles);
  const { bias, confidence } = computeBias(structureEvents, orderBlocks, fvgs, candles[candles.length - 1].close);
  const keyLevels = buildKeyLevels(orderBlocks, fvgs, structureEvents);

  const last = candles[candles.length - 1];

  return {
    symbol,
    interval,
    lastPrice: last.close,
    lastTime: last.time,
    swingPoints,
    orderBlocks,
    fvgs,
    structureEvents,
    bias,
    confidence,
    keyLevels,
    candles,
  };
}

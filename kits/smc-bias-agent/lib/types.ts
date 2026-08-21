export interface Candle {
  time: number; // unix seconds (candle open time)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SwingType = "high" | "low";

export interface SwingPoint {
  index: number;
  time: number;
  price: number;
  type: SwingType;
}

export type Bias = "bullish" | "bearish" | "neutral";

export interface OrderBlock {
  type: "bullish" | "bearish";
  startIndex: number;
  endIndex: number; // index of the impulse candle that confirmed the block
  top: number;
  bottom: number;
  time: number;
  mitigated: boolean; // has price returned into the zone since it formed
}

export interface FairValueGap {
  type: "bullish" | "bearish";
  index: number; // index of the middle candle of the 3-candle pattern
  top: number;
  bottom: number;
  time: number;
  filled: boolean; // has price fully closed the gap since it formed
}

export interface StructureEvent {
  type: "BOS" | "CHoCH";
  direction: "bullish" | "bearish";
  index: number;
  time: number;
  brokenLevel: number;
  breakPrice: number;
}

export interface KeyLevel {
  label: string;
  detail: string;
  low: number;
  high: number;
}

export interface SMCAnalysis {
  symbol: string;
  interval: string;
  lastPrice: number;
  lastTime: number;
  swingPoints: SwingPoint[];
  orderBlocks: OrderBlock[];
  fvgs: FairValueGap[];
  structureEvents: StructureEvent[];
  bias: Bias;
  confidence: number; // 0-100
  keyLevels: KeyLevel[];
  candles: Candle[];
}

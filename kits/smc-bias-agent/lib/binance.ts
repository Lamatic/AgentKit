import { Candle } from "./types";

const BINANCE_BASE = "https://api.binance.com/api/v3/klines";

const ALLOWED_INTERVALS = new Set([
  "15m",
  "1h",
  "4h",
  "1d",
]);

export function isValidInterval(interval: string): boolean {
  return ALLOWED_INTERVALS.has(interval);
}

export async function fetchCandles(symbol: string, interval: string, limit = 150): Promise<Candle[]> {
  if (!isValidInterval(interval)) {
    throw new Error(`Unsupported interval "${interval}". Use one of: ${[...ALLOWED_INTERVALS].join(", ")}`);
  }

  const url = `${BINANCE_BASE}?symbol=${encodeURIComponent(symbol.toUpperCase())}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 30 } });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Binance request failed (${res.status}): ${body || res.statusText}`);
  }

  const raw = (await res.json()) as unknown[];

  return raw.map((row) => {
    const r = row as [number, string, string, string, string, string, ...unknown[]];
    return {
      time: Math.floor(r[0] / 1000),
      open: parseFloat(r[1]),
      high: parseFloat(r[2]),
      low: parseFloat(r[3]),
      close: parseFloat(r[4]),
      volume: parseFloat(r[5]),
    };
  });
}

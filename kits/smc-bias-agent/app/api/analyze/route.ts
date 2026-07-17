import { NextRequest, NextResponse } from "next/server";
import { fetchCandles } from "@/lib/binance";
import { analyzeSMC } from "@/lib/smc";
import { getBiasNarrative } from "@/lib/lamatic-client";

export async function POST(req: NextRequest) {
  let body: { symbol?: string; interval?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const symbol = (body.symbol || "").trim().toUpperCase();
  const interval = (body.interval || "4h").trim();

  if (!symbol) {
    return NextResponse.json({ error: "Provide a symbol, e.g. BTCUSDT." }, { status: 400 });
  }

  try {
    const candles = await fetchCandles(symbol, interval);
    const analysis = analyzeSMC(symbol, interval, candles);
    const narrative = await getBiasNarrative(analysis);

    return NextResponse.json({ analysis, narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error while analyzing the symbol.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

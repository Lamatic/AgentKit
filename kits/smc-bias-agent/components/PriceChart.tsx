import { SMCAnalysis } from "@/lib/types";

const VIEW_W = 900;
const VIEW_H = 420;
const PAD_TOP = 24;
const PAD_BOTTOM = 28;
const PAD_LEFT = 8;
const PAD_RIGHT = 64;
const MAX_CANDLES = 44;

export default function PriceChart({ analysis }: { analysis: SMCAnalysis }) {
  const all = analysis.candles;
  const start = Math.max(0, all.length - MAX_CANDLES);
  const candles = all.slice(start);

  const plotW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const slot = plotW / candles.length;
  const bodyW = Math.max(2, slot * 0.6);

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const zoneHighs = [...analysis.orderBlocks, ...analysis.fvgs].map((z) => z.top);
  const zoneLows = [...analysis.orderBlocks, ...analysis.fvgs].map((z) => z.bottom);
  const maxPrice = Math.max(...highs, ...zoneHighs);
  const minPrice = Math.min(...lows, ...zoneLows);
  const span = maxPrice - minPrice || 1;

  const xAt = (localIndex: number) => PAD_LEFT + localIndex * slot + slot / 2;
  const yAt = (price: number) => PAD_TOP + (1 - (price - minPrice) / span) * plotH;

  const localIndexOf = (globalIndex: number) => globalIndex - start;
  const inView = (globalIndex: number) => globalIndex >= start;

  const gridLines = 4;
  const gridPrices = Array.from({ length: gridLines + 1 }, (_, i) => minPrice + (span * i) / gridLines);

  const lastEvent = analysis.structureEvents[analysis.structureEvents.length - 1];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" role="img" aria-label={`Candlestick chart for ${analysis.symbol} with detected SMC zones`}>
      {gridPrices.map((p, i) => (
        <g key={i}>
          <line x1={PAD_LEFT} x2={VIEW_W - PAD_RIGHT} y1={yAt(p)} y2={yAt(p)} stroke="#2A2E3A" strokeWidth={1} />
          <text x={VIEW_W - PAD_RIGHT + 8} y={yAt(p)} dy={4} fontFamily="var(--font-mono)" fontSize={11} fill="#7D8394">
            {p.toFixed(p < 10 ? 4 : 1)}
          </text>
        </g>
      ))}

      {analysis.orderBlocks
        .filter((ob) => !ob.mitigated && inView(ob.startIndex))
        .map((ob, i) => (
          <rect
            key={`ob-${i}`}
            x={PAD_LEFT}
            width={plotW}
            y={yAt(ob.top)}
            height={Math.max(2, yAt(ob.bottom) - yAt(ob.top))}
            fill={ob.type === "bullish" ? "rgba(216,166,87,0.14)" : "rgba(196,87,75,0.10)"}
            stroke={ob.type === "bullish" ? "rgba(216,166,87,0.4)" : "rgba(196,87,75,0.3)"}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        ))}

      {analysis.fvgs
        .filter((f) => !f.filled && inView(f.index))
        .map((f, i) => (
          <rect
            key={`fvg-${i}`}
            x={PAD_LEFT}
            width={plotW}
            y={yAt(f.top)}
            height={Math.max(2, yAt(f.bottom) - yAt(f.top))}
            fill={f.type === "bullish" ? "rgba(79,174,138,0.10)" : "rgba(196,87,75,0.08)"}
          />
        ))}

      {lastEvent && inView(lastEvent.index) && (
        <g>
          <line
            x1={PAD_LEFT}
            x2={VIEW_W - PAD_RIGHT}
            y1={yAt(lastEvent.brokenLevel)}
            y2={yAt(lastEvent.brokenLevel)}
            stroke="#D8A657"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text x={PAD_LEFT + 4} y={yAt(lastEvent.brokenLevel) - 6} fontFamily="var(--font-mono)" fontSize={11} fill="#D8A657">
            {lastEvent.type} · {lastEvent.brokenLevel.toFixed(lastEvent.brokenLevel < 10 ? 4 : 1)}
          </text>
        </g>
      )}

      {candles.map((c, i) => {
        const bullish = c.close >= c.open;
        const x = xAt(i);
        const color = bullish ? "#4FAE8A" : "#C4574B";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yAt(c.high)} y2={yAt(c.low)} stroke={color} strokeWidth={1} />
            <rect
              x={x - bodyW / 2}
              width={bodyW}
              y={yAt(Math.max(c.open, c.close))}
              height={Math.max(1, Math.abs(yAt(c.open) - yAt(c.close)))}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
}

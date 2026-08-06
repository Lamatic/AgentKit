import { bandColor } from "@/lib/severity";

export function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const size = 128;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;
  const color = bandColor(clamped);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[32px] font-semibold leading-none text-fg">{clamped}</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wide" style={{ color }}>
          Grade {grade}
        </span>
      </div>
    </div>
  );
}

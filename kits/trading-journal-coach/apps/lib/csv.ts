import Papa from "papaparse";
import type { Trade } from "./metrics";

const REQUIRED = ["date", "symbol", "side", "qty", "entry", "exit", "pnl"];
const MAX_REPORTED_ERRORS = 12;

export interface ParseResult {
  trades: Trade[];
  errors: string[];
  rowCount: number;
}

function normSide(v: string): "long" | "short" | null {
  const s = (v || "").trim().toLowerCase();
  if (["long", "buy", "b", "l"].includes(s)) return "long";
  if (["short", "sell", "s"].includes(s)) return "short";
  return null;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "").replace(/[₹,\s]/g, ""));
  return isNaN(n) ? NaN : n;
}

/** Parse a trade-log CSV into typed trades, collecting readable per-row errors. Runs client-side. */
export function parseTradesCsv(text: string): ParseResult {
  const errors: string[] = [];
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  // Papa reports structural problems (mismatched field counts, unclosed quotes) in its own
  // `errors` array, separately from our field validation. Without this, a malformed row can
  // silently shift values across columns and still look like a valid trade.
  const malformedRows = new Set<number>();
  for (const e of parsed.errors || []) {
    if (typeof e.row === "number") malformedRows.add(e.row);
    if (errors.length < MAX_REPORTED_ERRORS) {
      errors.push(
        typeof e.row === "number" ? `Row ${e.row + 2}: ${e.message}` : `File: ${e.message}`,
      );
    }
  }

  const headers = parsed.meta.fields || [];
  const missing = REQUIRED.filter((r) => !headers.includes(r));
  if (missing.length) {
    errors.push(`Missing required column(s): ${missing.join(", ")}. Expected header: ${REQUIRED.join(", ")}.`);
    return { trades: [], errors, rowCount: 0 };
  }

  const trades: Trade[] = [];
  parsed.data.forEach((row, i) => {
    const line = i + 2; // account for header row + 1-based
    // Already reported above as structurally malformed — don't trust its field alignment.
    if (malformedRows.has(i)) return;
    const side = normSide(row.side);
    const qty = num(row.qty), entry = num(row.entry), exit = num(row.exit), pnl = num(row.pnl);
    const rowErr: string[] = [];
    if (!row.date || isNaN(Date.parse(row.date))) rowErr.push("invalid date");
    if (!row.symbol) rowErr.push("missing symbol");
    if (!side) rowErr.push(`invalid side "${row.side ?? ""}" (use long/short)`);
    if (isNaN(qty) || qty <= 0) rowErr.push("invalid qty");
    if (isNaN(entry)) rowErr.push("invalid entry");
    if (isNaN(exit)) rowErr.push("invalid exit");
    if (isNaN(pnl)) rowErr.push("invalid pnl");
    if (rowErr.length) {
      if (errors.length < MAX_REPORTED_ERRORS) errors.push(`Row ${line}: ${rowErr.join(", ")}`);
      return;
    }
    trades.push({
      date: row.date.trim(),
      symbol: row.symbol.trim(),
      side: side as "long" | "short",
      qty, entry, exit, pnl,
      notes: row.notes?.trim() || undefined,
      exitDate: row.exitdate?.trim() || undefined,
      fees: row.fees != null && row.fees !== "" ? num(row.fees) : undefined,
    });
  });

  if (!trades.length && !errors.length) errors.push("No valid trades found in the file.");
  return { trades, errors, rowCount: parsed.data.length };
}

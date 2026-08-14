import { normalizeFocusRecord } from "./focus";
import type { FocusRow } from "./types";
import { sanitizeCsvCell } from "./validate-upload";

export class BillingParseError extends Error {}

/** Minimal RFC4180 CSV line splitter — handles quoted fields and escaped quotes. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function toUtcIso(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) {
    throw new BillingParseError(`unparseable timestamp: ${ts}`);
  }
  return d.toISOString();
}

/** Parses a FOCUS CSV (1.0 or 1.4 column names) into normalized, UTC-timestamped FocusRow[]. */
export function parseBillingCsv(csvText: string): FocusRow[] {
  const lines = csvText.split(/\r\n|\n/).filter((l) => l.length > 0);
  if (lines.length === 0) throw new BillingParseError("empty file");

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const rows: FocusRow[] = [];
  let currency: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]).map(sanitizeCsvCell);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = (cells[idx] ?? "").trim();
    });

    const row = normalizeFocusRecord(raw);
    row.ChargePeriodStart = toUtcIso(row.ChargePeriodStart);
    row.ChargePeriodEnd = toUtcIso(row.ChargePeriodEnd);

    if (currency === null) currency = row.BillingCurrency;
    else if (row.BillingCurrency !== currency) {
      throw new BillingParseError(
        `mixed currency in upload: ${currency} vs ${row.BillingCurrency} (row ${i + 1})`,
      );
    }

    rows.push(row);
  }

  return rows;
}

import { normalizeFocusRecord } from "./focus";
import type { FocusRow } from "./types";
import { sanitizeCsvCell } from "./validate-upload";

export class BillingParseError extends Error {}

// Numeric columns must stay parseable by Number(...) — CSV-injection sanitization
// (which prefixes a leading apostrophe) only applies to string/display fields.
const NUMERIC_COLUMNS = new Set(["EffectiveCost", "BilledCost", "PricingQuantity"]);

/**
 * RFC4180-aware CSV tokenizer over the *whole file*, not line-by-line — a quoted
 * field may legally contain a raw newline (e.g. a multiline Tags or
 * ChargeDescription value), and splitting on \r\n|\n first would break that
 * field across two "lines". Returns one array of fields per record.
 */
function parseCsvRecords(csvText: string): string[][] {
  const records: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  const endField = () => {
    record.push(field);
    field = "";
  };
  const endRecord = () => {
    endField();
    records.push(record);
    record = [];
  };

  let i = 0;
  while (i < csvText.length) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csvText[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
    } else if (ch === ",") {
      endField();
      i++;
    } else if (ch === "\r" && csvText[i + 1] === "\n") {
      endRecord();
      i += 2;
    } else if (ch === "\n") {
      endRecord();
      i++;
    } else {
      field += ch;
      i++;
    }
  }

  if (inQuotes) {
    throw new BillingParseError("unterminated quoted field in CSV");
  }
  if (field !== "" || record.length > 0) {
    endRecord();
  }

  // drop blank lines (a record with a single empty field, e.g. a trailing newline)
  return records.filter((r) => !(r.length === 1 && r[0] === ""));
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
  const records = parseCsvRecords(csvText);
  if (records.length === 0) throw new BillingParseError("empty file");

  const headers = records[0].map((h) => h.trim());
  const rows: FocusRow[] = [];
  let currency: string | null = null;

  for (let i = 1; i < records.length; i++) {
    const cells = records[i];
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const cell = (cells[idx] ?? "").trim();
      raw[h] = NUMERIC_COLUMNS.has(h) ? cell : sanitizeCsvCell(cell);
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

// FOCUS usage-CSV parser. FOCUS (the FinOps Foundation's billing spec) has ~50
// columns; this reads the handful carbon accounting needs and is tolerant of
// the common column-name variants each provider's export uses.

import type { CloudProvider, FocusUsageRow } from "./types";
import { lookupRegion } from "./emissions-factors";
import { sanitizeCsvCell } from "./validate-upload";

export class FocusParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FocusParseError";
  }
}

// Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes ("")
// and commas/newlines inside quotes. Good enough for billing exports, with no
// dependency.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c.length > 0) || rows.length > 0) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

// Accepted header aliases → canonical field. Compared case-insensitively with
// non-alphanumeric characters stripped, so "Region Id", "region_id" and
// "RegionId" all match.
const HEADER_ALIASES: Record<string, string[]> = {
  provider: ["providername", "provider", "cloudprovider"],
  serviceName: ["servicename", "service", "productname", "productcode"],
  serviceCategory: ["servicecategory", "category", "productfamily"],
  regionId: ["regionid", "region", "availabilityzone", "location"],
  subAccountId: ["subaccountid", "subaccountname", "linkedaccountid", "accountid", "subscriptionid"],
  skuId: ["skuid", "sku", "usagetype", "metercategory"],
  resourceType: ["resourcetype", "resourcekind"],
  chargePeriodStart: ["chargeperiodstart", "usagestartdate", "date", "billingperiodstart"],
  chargePeriodEnd: ["chargeperiodend", "usageenddate", "billingperiodend"],
  pricingUnit: ["pricingunit", "usageunit", "unit", "meterunit"],
  pricingQuantity: ["pricingquantity", "usagequantity", "consumedquantity", "quantity"],
  billedCost: ["billedcost", "effectivecost", "cost", "unblendedcost", "pretaxcost"],
  billingCurrency: ["billingcurrency", "currency", "currencycode"],
};

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildColumnIndex(header: string[]): Record<string, number> {
  const normalized = header.map(normalizeHeader);
  const index: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      const at = normalized.indexOf(alias);
      if (at !== -1) {
        index[field] = at;
        break;
      }
    }
  }
  return index;
}

function coerceProvider(raw: string | undefined, regionId: string): CloudProvider {
  const v = (raw ?? "").toLowerCase();
  if (v.includes("aws") || v.includes("amazon")) return "aws";
  if (v.includes("gcp") || v.includes("google")) return "gcp";
  if (v.includes("azure") || v.includes("microsoft")) return "azure";
  return lookupRegion(regionId)?.provider ?? "unknown";
}

export function parseFocusCsv(text: string): FocusUsageRow[] {
  const table = parseCsv(text);
  if (table.length < 2) {
    throw new FocusParseError("CSV has no data rows — expected a header row and at least one usage row.");
  }
  const header = table[0];
  const col = buildColumnIndex(header);

  const required = ["serviceName", "regionId", "pricingUnit", "pricingQuantity"];
  const missing = required.filter((r) => col[r] === undefined);
  if (missing.length > 0) {
    throw new FocusParseError(
      `CSV is missing required column(s): ${missing.join(", ")}. ` +
        `Expected a FOCUS-style export with at least ServiceName, RegionId, PricingUnit, and PricingQuantity.`,
    );
  }

  const get = (r: string[], field: string): string => {
    const at = col[field];
    return at === undefined ? "" : sanitizeCsvCell((r[at] ?? "").trim());
  };

  // Raw (unsanitized) trimmed cell, for numeric fields only — sanitizeCsvCell
  // prefixes a leading "+", "-", "=", or "@" with an apostrophe, which would
  // turn a legitimate quantity like "+10" into NaN.
  const getRaw = (r: string[], field: string): string => {
    const at = col[field];
    return at === undefined ? "" : (r[at] ?? "").trim();
  };

  const MAX_DATA_ROWS = 100_000;

  const rows: FocusUsageRow[] = [];
  for (let i = 1; i < table.length; i++) {
    const r = table[i];
    if (r.every((c) => c.trim() === "")) continue;

    if (rows.length >= MAX_DATA_ROWS) {
      throw new FocusParseError(
        `Too many usage rows — exceeds the ${MAX_DATA_ROWS}-row cap. Split the export by period or account.`,
      );
    }

    const quantity = Number(getRaw(r, "pricingQuantity").replace(/[, ]/g, ""));
    if (!Number.isFinite(quantity) || quantity < 0) continue; // skip credits / malformed

    const regionId = get(r, "regionId") || "unknown";
    const cost = Number(getRaw(r, "billedCost").replace(/[$, ]/g, ""));

    rows.push({
      provider: coerceProvider(col.provider !== undefined ? get(r, "provider") : undefined, regionId),
      serviceName: get(r, "serviceName") || "Unknown service",
      serviceCategory: get(r, "serviceCategory") || "Compute",
      regionId,
      subAccountId: get(r, "subAccountId") || "unknown",
      skuId: get(r, "skuId") || undefined,
      resourceType: get(r, "resourceType") || undefined,
      chargePeriodStart: get(r, "chargePeriodStart"),
      chargePeriodEnd: get(r, "chargePeriodEnd"),
      pricingUnit: get(r, "pricingUnit") || "Unit",
      pricingQuantity: quantity,
      billedCost: Number.isFinite(cost) ? cost : undefined,
      billingCurrency: get(r, "billingCurrency") || undefined,
    });
  }

  if (rows.length === 0) {
    throw new FocusParseError("No usable usage rows found — every row was empty, a credit, or malformed.");
  }
  return rows;
}

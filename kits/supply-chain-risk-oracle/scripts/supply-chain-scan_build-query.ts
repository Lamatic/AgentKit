const raw = input.parsed_suppliers;

let suppliers = [];
try {
  const parsed = typeof raw === "string"
    ? JSON.parse(raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim())
    : raw;
  const extracted = Array.isArray(parsed)
    ? parsed
    : (parsed?.suppliers ?? parsed?.risk_matrix ?? Object.values(parsed ?? {}));
  suppliers = Array.isArray(extracted) ? extracted : [];
} catch (e) {
  suppliers = [];
}

const locationTerms = suppliers
  .map((s) => s?.location?.split(",")[0].trim())
  .filter(Boolean)
  .join(" OR ");

const locationQuery = locationTerms ? ` (${locationTerms})` : "";
const newsQuery = `supply chain disruption OR labor strike OR port closure OR typhoon OR flood OR earthquake OR sanctions${locationQuery}`;

const primarySupplier = suppliers[0];

output = {
  news_query: newsQuery,
  weather_lat: String(primarySupplier?.lat ?? "22.5431"),
  weather_lon: String(primarySupplier?.lng ?? "114.0579"),
  supplier_count: suppliers.length
};

const raw = input.parsed_suppliers;

const suppliers = typeof raw === "string"
  ? JSON.parse(raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim())
  : Array.isArray(raw)
    ? raw
    : (raw?.suppliers ?? raw?.risk_matrix ?? Object.values(raw ?? {}));

const locationTerms = suppliers
  .map((s) => s.location.split(",")[0].trim())
  .join(" OR ");

const newsQuery = `supply chain disruption OR labor strike OR port closure OR typhoon OR flood OR earthquake OR sanctions (${locationTerms})`;

const primarySupplier = suppliers[0];

output = {
  news_query: newsQuery,
  weather_lat: String(primarySupplier?.lat ?? "22.5431"),
  weather_lon: String(primarySupplier?.lng ?? "114.0579"),
  supplier_count: suppliers.length
};

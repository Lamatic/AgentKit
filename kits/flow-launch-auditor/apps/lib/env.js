export function isTruthyEnvValue(value) {
  return ["true", "1", "yes"].includes(String(value || "").trim().toLowerCase());
}

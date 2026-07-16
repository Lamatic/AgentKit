export function normalizeText(value) {
  return normalizeWhitespace(value).toLowerCase();
}

export function normalizeWhitespace(value) {
  return String(value || "")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

const secretKeySource =
  "([A-Z][A-Z0-9_-]*(?:API[_-]?KEY|[_-]KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|PRIVATE[_-]?KEY|WEBHOOK(?:[_-]?URL)?)|API[_-]?KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|PRIVATE[_-]?KEY|WEBHOOK(?:[_-]?URL)?)";
const pemAssignmentPattern = new RegExp(
  `\\b${secretKeySource}\\s*[:=]\\s*-----BEGIN [^-]+-----[\\s\\S]*?-----END [^-]+-----`,
  "gi"
);
const quotedAssignmentPattern = new RegExp(`\\b${secretKeySource}\\s*[:=]\\s*("[^"\\r\\n]*"|'[^'\\r\\n]*')`, "gi");
const unquotedAssignmentPattern = new RegExp(
  `\\b${secretKeySource}\\s*[:=]\\s*([^,;\\r\\n]+?)(?=\\s+${secretKeySource}\\s*[:=]|[,;]|\\r?\\n|$)`,
  "gi"
);
const bearerPattern = /\b(bearer\s+)[^,;\r\n]+/gi;
const basicAuthPattern = /\b(basic\s+)[A-Za-z0-9+/=]+/gi;
const databaseUrlPattern = /\b(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|redis):\/\/[^\s'"<>]+/gi;
const credentialedHttpUrlPattern = /\bhttps?:\/\/[^/\s:@]+:[^@\s/]+@[^\s'"<>]+/gi;
const barePemPattern = /-----BEGIN [^-]+-----[\s\S]*?-----END [^-]+-----/g;
const webhookUrlPatterns = [
  /\bhttps:\/\/hooks\.slack\.com\/services\/[^\s'"<>]+/gi,
  /\bhttps:\/\/(?:discord(?:app)?\.com)\/api\/webhooks\/[^\s'"<>]+/gi
];
const jwtPattern = /(^|[^A-Za-z0-9_-])(eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*)(?=$|[^A-Za-z0-9_-])/g;
const commonSecretPatterns = [
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
  /\bsk-[A-Za-z0-9_-]{8,}/g,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}/g,
  /\bAIza[0-9A-Za-z_-]{20,}/g
];

export function redactSecretValues(text) {
  let redacted = String(text || "").replace(pemAssignmentPattern, "$1=<redacted>");
  redacted = redacted.replace(barePemPattern, "<redacted>");
  redacted = redacted.replace(quotedAssignmentPattern, "$1=<redacted>");
  redacted = redacted.replace(unquotedAssignmentPattern, "$1=<redacted>");
  redacted = redacted.replace(bearerPattern, "$1<redacted>");
  redacted = redacted.replace(basicAuthPattern, "$1<redacted>");
  redacted = redacted.replace(databaseUrlPattern, "<redacted>");
  redacted = redacted.replace(credentialedHttpUrlPattern, "<redacted>");
  for (const pattern of webhookUrlPatterns) {
    redacted = redacted.replace(pattern, "<redacted>");
  }
  redacted = redacted.replace(jwtPattern, "$1<redacted>");
  for (const pattern of commonSecretPatterns) {
    redacted = redacted.replace(pattern, "<redacted>");
  }
  return redacted;
}

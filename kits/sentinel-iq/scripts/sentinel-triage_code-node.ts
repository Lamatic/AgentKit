export default function extractIOCs(input: { alert_text: string }) {
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const domainRegex = /\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/gi;
  const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g;
  const userRegex = /\buser[:=]\s*([a-zA-Z0-9._-]+)/gi;

  const text = input.alert_text || "";
  const ips = text.match(ipRegex) || [];
  const domains = text.match(domainRegex) || [];
  const hashes = text.match(hashRegex) || [];
  const users = [...text.matchAll(userRegex)].map(m => m[1]);

  return {
    extracted_iocs: [...new Set([...ips, ...domains, ...hashes, ...users])]
  };
}
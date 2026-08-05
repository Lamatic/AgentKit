export type UrlChipOrigin = "template" | "custom";

export type UrlChipStatus = "pending" | "checking" | "ok" | "error";

export type UrlChip = {
  id: string;
  url: string;
  origin: UrlChipOrigin;
  status: UrlChipStatus;
  httpStatus?: number;
  message?: string;
};

export type SourceTemplate = {
  id: string;
  label: string;
  urls: string[];
  query: string;
};

const BROOKINGS =
  "https://www.brookings.edu/articles/regulating-general-purpose-ai-areas-of-convergence-and-divergence-across-the-eu-and-the-us";
const EFF =
  "https://www.eff.org/deeplinks/2026/06/ai-regulation-should-be-rational-not-retaliatory";
/** NIST + AI Act return HTTP 200 (OECD returns 403). */
const NIST = "https://www.nist.gov/artificial-intelligence";
const AI_ACT = "https://artificialintelligenceact.eu/";

/** Clickable packs: 1, 2, and 4 source templates. */
export const SOURCE_TEMPLATES: SourceTemplate[] = [
  {
    id: "eff-anthropic",
    label: "1 source · EFF",
    urls: [EFF],
    query:
      "Why does the EFF argue that the government's decision to impose export controls on Anthropic's AI models constitutes unconstitutional retaliation rather than a legitimate national security measure?",
  },
  {
    id: "eu-us-compare",
    label: "2 sources · EU vs US",
    urls: [BROOKINGS, AI_ACT],
    query:
      "Where do EU and US approaches to regulating general-purpose AI converge, and where do they diverge?",
  },
  {
    id: "ai-regulation-4",
    label: "4 sources · AI regulation",
    urls: [BROOKINGS, EFF, NIST, AI_ACT],
    query:
      "How do major actors propose regulating general-purpose AI, and where do EU, US, and civil-liberties perspectives agree or clash?",
  },
];

export function newChipId() {
  return `chip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

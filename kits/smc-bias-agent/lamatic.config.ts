// NOTE: field names here are my best inference from the public repo structure
// (every kit is typed via this file's `type` field: "template" | "bundle" | "kit").
// Confirm this against an existing sibling kit's lamatic.config.ts after forking
// and adjust field names if the actual schema differs.

const config = {
  name: "SMC Bias Agent",
  slug: "smc-bias-agent",
  type: "kit" as const,
  description:
    "Detects Smart Money Concepts structure (order blocks, fair value gaps, break of structure / change of character) on a crypto pair and returns a plain-English directional bias with key levels to watch.",
  tags: ["crypto", "trading", "smc", "ict", "technical-analysis"],
};

export default config;

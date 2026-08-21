export const meta = {
  title: "Data Quality Issue Detector",
  description: "Analyzes datasets for quality problems and generates a structured report."
};

export const inputs = {
  file: {
    type: "file",
    required: true,
    acceptedTypes: [".csv", ".xlsx"]
  }
};

export const nodes = [
  {
    id: "extract_data",
    type: "script",
    scriptRef: "@scripts/data-quality-extract.ts"
  },
  {
    id: "analyze_quality",
    type: "llm",
    promptRef: "@prompts/data-quality_analysis.md"
  },
  {
    id: "format_report",
    type: "script",
    scriptRef: "@scripts/data-quality-format.ts"
  }
];

export const edges = [
  { from: "extract_data", to: "analyze_quality" },
  { from: "analyze_quality", to: "format_report" }
];

export const references = {
  "prompts": {
    "data_quality_analysis": "@prompts/data-quality_analysis.md"
  },
  "scripts": {
    "data_quality_extract": "@scripts/data-quality-extract.ts",
    "data_quality_format": "@scripts/data-quality-format.ts"
  }
};

export default { meta, inputs, references, nodes, edges };
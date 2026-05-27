const config = require("../lamatic.config.js");

const flows = {
  "research-paper-analyzer": {
    name: config.name,
    workflowId: process.env.RESEARCH_PAPER_ANALYZER_FLOW_ID ?? "",
    inputSchema: {
      pdf_url: { type: "string" },
    },
  },
};

module.exports = { config, flows };

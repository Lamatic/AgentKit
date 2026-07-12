const dynamicRaw = {{codeNode_175.output}};
const staticRaw = {{codeNode_587.output}};

/**
 * Distinguishes a real report from Lamatic's skipped-node placeholder object,
 * since only one of the two branch outputs actually ran per request.
 * @param r - The candidate branch output (Report Compiler or Static Report Compiler).
 * @returns True if r looks like a real report (has overallScore and verdict).
 */
function isValidReport(r) {
  return r && typeof r === "object" && "overallScore" in r && "verdict" in r;
}

let report;
if (isValidReport(dynamicRaw)) {
  report = dynamicRaw;
} else if (isValidReport(staticRaw)) {
  report = staticRaw;
} else {
  report = { error: "No report was generated — check the flow configuration." };
}

output = report;

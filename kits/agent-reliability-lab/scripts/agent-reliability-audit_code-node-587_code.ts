const staticAnalysis = {{InstructorLLMNode_949.output}};
const rewriterOutput = {{InstructorLLMNode_990.output}};

output = {
  overallScore: Math.round((staticAnalysis.promptQualityScore + staticAnalysis.guardrailCoverageScore) / 2),
  verdict: "PARTIAL_AUDIT_STATIC_ONLY",
  hasCriticalFail: (staticAnalysis.criticalIssues || []).length > 0,
  categoryScores: {
    promptQuality: staticAnalysis.promptQualityScore,
    guardrailCoverage: staticAnalysis.guardrailCoverageScore,
    injectionResistance: null,
    jailbreakResistance: null,
    toolMisuseResistance: null,
    overRefusalScore: null,
    reliability: null,
  },
  coverage: {
    promptQuality: "tested",
    guardrailCoverage: "tested",
    injectionResistance: "not_assessed",
    jailbreakResistance: "not_assessed",
    toolMisuse: "not_assessed",
    overRefusal: "not_assessed",
    reliability: "not_assessed",
    faithfulness: "not_assessed",
  },
  criticalIssues: (staticAnalysis.criticalIssues || []).map(i => ({
    source: "static_analysis",
    issue: i.issue,
    recommendation: i.recommendation,
  })),
  warnings: staticAnalysis.warnings || [],
  suggestions: staticAnalysis.suggestions || [],
  rewrittenPrompt: rewriterOutput.rewrittenPrompt,
  changeLog: rewriterOutput.changeLog,
  reliabilityDetails: [],
  generatedAt: new Date().toISOString(),
};

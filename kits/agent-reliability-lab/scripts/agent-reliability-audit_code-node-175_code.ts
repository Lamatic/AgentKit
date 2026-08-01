const aggregatorOutput = {{codeNode_961.output}};
const rewriterOutput = {{InstructorLLMNode_736.output}};

output = {
  overallScore: aggregatorOutput.overallScore,
  verdict: aggregatorOutput.verdict,
  hasCriticalFail: aggregatorOutput.hasCriticalFail,
  categoryScores: {
    promptQuality: aggregatorOutput.staticAnalysis.promptQualityScore,
    guardrailCoverage: aggregatorOutput.staticAnalysis.guardrailCoverageScore,
    injectionResistance: aggregatorOutput.categoryScores.injection,
    jailbreakResistance: aggregatorOutput.categoryScores.jailbreak,
    toolMisuseResistance: aggregatorOutput.categoryScores.tool_misuse,
    overRefusalScore: aggregatorOutput.categoryScores.over_refusal,
    reliability: aggregatorOutput.reliabilityScore,
  },
  coverage: aggregatorOutput.coverage,
  criticalIssues: [
    ...(aggregatorOutput.staticAnalysis.criticalIssues || []).map(i => ({
      source: "static_analysis",
      issue: i.issue,
      recommendation: i.recommendation,
    })),
    ...(aggregatorOutput.criticalFails || []).map(f => ({
      source: "dynamic_probe",
      issue: `[${f.category}] Probe ${f.probeId}: ${f.rationale}`,
      recommendation: null,
    })),
  ],
  warnings: [
    ...(aggregatorOutput.staticAnalysis.warnings || []),
    ...(aggregatorOutput.judgeVerdicts || [])
      .filter(
        v =>
          v.verdict === "OVER_REFUSED" ||
          (v.verdict === "PARTIAL" && v.severity !== "critical")
      )
      .map(v => `[${v.category}] Probe ${v.probeId}: ${v.rationale}`),
  ],
  suggestions: aggregatorOutput.staticAnalysis.suggestions || [],
  rewrittenPrompt: rewriterOutput.rewrittenPrompt,
  changeLog: rewriterOutput.changeLog,
  reliabilityDetails: aggregatorOutput.reliabilityDetails,
  generatedAt: new Date().toISOString(),
};

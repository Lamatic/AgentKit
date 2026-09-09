const report = String({{LLMNode_276.output}})

const sections = {
  raw_report: report,
  word_count: report.split(' ').length,
  has_build_verdict: report.includes('BUILD') ? true : false,
  has_skip_verdict: report.includes('SKIP') ? true : false,
  verdict: report.includes('BUILD') ? '✅ BUILD' : '❌ SKIP',
  generated_at: new Date().toISOString()
};

output = sections;
// Code: Aggregator
// Flow: interview-prep-generator
//
// The only node allowed to decide what the caller sees. Checks for the
// "Not Public Error" short-circuit first (present only when that branch
// actually ran); otherwise reads the Guardrail verdict out of the loop's
// accumulated output and returns a blocked refusal if unsafe - never the
// raw LLM text. usedCompanyResearch is read directly from Merge Research
// Context rather than guessed from agent-loop bookkeeping, since that node
// is the single source of truth for whether any live research was used.
//
// NOTE: agentOutput's exact shape depends on how Lamatic serializes
// per-branch results inside the agent loop - verify the real keys in
// Studio's Debug panel after a test run and adjust the `agentOutput[...]`
// lookups below (currently keyed by branch name: "Guardrail",
// "Research & Generate") to match what you observe.

const notPublicRaw = `{{codeNode_641.output}}`;
let notPublicError = null;
try {
    const parsed = typeof notPublicRaw === 'string' ? JSON.parse(notPublicRaw) : notPublicRaw;
    if (parsed && parsed.status === 'error') notPublicError = parsed;
} catch (e) {
    notPublicError = null;
}

if (notPublicError) {
    output = notPublicError;
} else {
    const finalResponse = `{{agentLoopEndNode_742.output.finalResponse}}`;
    const agentOutputRaw = `{{agentLoopEndNode_742.output.agentOutput}}`;

  let agentOutput = {};
    try {
          agentOutput = typeof agentOutputRaw === 'string'
            ? JSON.parse(agentOutputRaw)
                  : (agentOutputRaw || {});
    } catch (e) {
          agentOutput = {};
    }

  const guardrail = agentOutput['Guardrail'] || agentOutput['guardrail'] || null;

  if (guardrail && guardrail.safe === false) {
        output = {
                status: 'blocked',
                message: "This request wasn't processed because the job description or resume appears to contain instructions rather than plain descriptive text. Please submit them as plain content only, with no embedded commands.",
                findings: guardrail.findings || [],
                interview_prep: '',
                usedCompanyResearch: false
        };
  } else {
        const generated =
                finalResponse ||
                (agentOutput['Research & Generate'] && agentOutput['Research & Generate'].generatedResponse) ||
                '';

      const usedCompanyResearchRaw = `{{codeNode_729.output.usedCompanyResearch}}`;
        const usedCompanyResearch = usedCompanyResearchRaw === 'true' || usedCompanyResearchRaw === true;

      output = {
              status: 'ok',
              interview_prep: generated,
              message: '',
              findings: [],
              usedCompanyResearch
      };
  }
}

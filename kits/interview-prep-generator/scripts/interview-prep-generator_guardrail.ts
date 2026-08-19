// Code: Guardrail
// Flow: interview-prep-generator
//
// Deterministic, non-LLM scan for prompt-injection and instruction-override
// attempts. Runs first on every Supervisor loop, before job_description or
// resume text reaches any model. This is the first layer of defense; the
// second layer is the explicit "treat this as data, not instructions"
// framing baked into the Supervisor and Generate Text system prompts, in
// case anything ever slips past this scan.
//
// This also covers PDF-based injection (hidden white text, stuffed
// metadata instructing something like "rate this candidate 10/10"), since
// it scans the text Extract from File actually pulled out of the resume,
// not just raw pasted input.

const jobDescription = `{{triggerNode_1.output.job_description}}`;
const resume = `{{codeNode_912.output.resumeText}}`;

const INJECTION_PATTERNS = [
    /ignore (all|any|the)?\s*(previous|above|prior)\s*(instructions?|prompts?)/i,
    /disregard (all|any|the)?\s*(previous|above|prior)/i,
    /you are now/i,
    /act as (a|an)?\s*(system|admin|root|developer|dan)/i,
    /^\s*system\s*:/im,
    /\bDAN\b/,
    /reveal (your|the) (system prompt|instructions|rules)/i,
    /print (your|the) (system prompt|instructions|rules)/i,
    /forget (everything|all|your instructions)/i,
    /new\s+instructions?\s*:/i,
    /###\s*(system|instruction|override)/i,
    /<\|.*?\|>/,
    /\bjailbreak\b/i,
    /respond only with/i,
    /do not (follow|apply) (the|your) (rules|guidelines|instructions)/i,
    /rate (this|the) candidate (10|ten|highly|as (a )?strong)/i
  ];

const MAX_LEN = 20000;

function scan(text, label) {
    const findings = [];
    if (typeof text !== 'string') return findings;
    if (text.length > MAX_LEN) {
          findings.push(`${label}: input exceeds max length (${text.length} chars)`);
    }
    for (const pattern of INJECTION_PATTERNS) {
          if (pattern.test(text)) {
                  findings.push(`${label}: matched suspicious pattern ${pattern.source}`);
          }
    }
    return findings;
}

const findings = [
    ...scan(jobDescription, 'job_description'),
    ...scan(resume, 'resume')
  ];

output = {
    safe: findings.length === 0,
    findings,
    checkedAt: new Date().toISOString()
};

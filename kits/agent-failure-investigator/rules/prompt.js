const CONTRADICTION_TABLE = [
  { a: /\b(concise|brief|short|single sentence|one sentence)\b/, b: /\b(comprehensive|detailed|in-depth|thorough|with examples)\b/, nameA: "be concise", nameB: "be comprehensive/detailed" },
  { a: /\balways\s+respond\s+in\b/, b: /\bprovide\s+comprehensive\b/, nameA: "a fixed response format", nameB: "open-ended depth" },
  { a: /\bnever\s+use\s+bullet/i, b: /\buse\s+bullet/i, nameA: "never use bullets", nameB: "use bullets" }
];

const VAGUE_PHRASES = ["as appropriate", "if needed", "when necessary", "etc", "and so on", "as required"];

definePlugin({
  id: "R31",
  category: "PROMPT_AMBIGUITY",
  points: 35,
  title: "The system prompt contains contradictory instructions",
  fix: "Remove the conflicting instruction pair and keep a single, explicit rule for length and depth.",
  prevention: "Lint system prompts in CI for known contradictory pairs (concise vs. comprehensive, always vs. never on the same topic).",
  test(trace) {
    const p = (trace.system_prompt || "").toLowerCase();
    const clash = CONTRADICTION_TABLE.find(row => row.a.test(p) && row.b.test(p));
    return clash ? {
      evidence: `The system prompt simultaneously instructs the model to ${clash.nameA} and to ${clash.nameB} — the model cannot satisfy both, so output quality becomes a coin flip.`,
      refs: [{ type: "prompt", index: 0 }]
    } : null;
  }
});

definePlugin({
  id: "R32",
  category: "PROMPT_AMBIGUITY",
  points: 15,
  title: "The system prompt leans on vague quantifiers",
  fix: "Replace vague quantifiers with explicit criteria: exact tone, exact structure, exact conditions.",
  prevention: "Adopt a prompt review checklist; vague terms (\"as appropriate\", \"if needed\", \"etc.\") must be justified or removed.",
  test(trace) {
    const p = (trace.system_prompt || "").toLowerCase();
    const hits = VAGUE_PHRASES.filter(v => p.includes(v));
    return hits.length >= 2 ? {
      evidence: `The system prompt uses ${hits.length} vague qualifiers (${hits.map(v => `"${v}"`).join(", ")}) — each one delegates a real decision back to the model.`,
      refs: [{ type: "prompt", index: 0 }]
    } : null;
  }
});

definePlugin({
  id: "R33",
  category: "PROMPT_AMBIGUITY",
  points: 15,
  title: "Output instability observed across runs of the same flow",
  fix: "Pin the output contract: exact length range, exact structure, temperature review.",
  prevention: "Add an output-shape validator to the flow so drift is caught at run time, not by users.",
  test(trace) {
    const li = findLogIndex(trace, l => /output.*(varies|mismatch|instab)/i.test(l.event + " " + l.message));
    return li === -1 ? null : {
      evidence: "Flow logs report unstable output shape across recent runs — a classic symptom of an under-specified prompt.",
      refs: [{ type: "log", index: li }]
    };
  }
});

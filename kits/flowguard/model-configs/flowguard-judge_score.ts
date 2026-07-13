// Model config: Score (InstructorLLMNode)
// Flow: flowguard-judge
//
// IMPORTANT judge-design notes (set these in Studio):
//  - Temperature 0 (determinism — the same output must always get the same score).
//  - Prefer a judge model from a DIFFERENT family than the typical target model,
//    to reduce self-preference bias. Document whichever you pick in the README.
//  - A small/cheap-but-capable model is fine and keeps per-run cost low.

export default {
  "generativeModelName": "",
  "memories": "[]",
  "messages": "[]",
  "attachments": ""
};

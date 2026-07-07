// Model config: Diagnose (InstructorLLMNode)
// Flow: investigate
//
// Deployed config in Studio: a strong reasoning model at temperature 0 for
// deterministic, evidence-grounded ranking (e.g. groq/llama-3.3-70b-versatile,
// or any capable model available in your Lamatic project).
//
// Temperature 0 is deliberate: incident triage must be repeatable — the same alert
// and evidence should yield the same ranking. Credentials are blanked for sharing;
// set your own model credential in Lamatic Studio.

export default {
  "generativeModelName": "@model-configs/investigate_diagnose.ts",
  "credentials": "@model-configs/investigate_diagnose.ts",
  "memories": "@model-configs/investigate_diagnose.ts",
  "messages": "@model-configs/investigate_diagnose.ts",
  "attachments": "@model-configs/investigate_diagnose.ts"
};

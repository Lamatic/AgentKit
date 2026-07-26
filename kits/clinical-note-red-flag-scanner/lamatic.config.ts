export default {
  name: "Clinical Note Red-Flag Scanner",
  description: "Accepts a clinical note as text and returns a structured, severity-ranked JSON list of documentation red flags — missing consent language, undocumented drug interactions, incomplete vitals, ambiguous dosing — so clinicians and compliance reviewers can triage documentation gaps without re-reading the full note.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Vilsee Kumar Shandilya","email":"viilseekshandilya@gmail.com"},
  tags: ["healthcare", "compliance", "clinical-ai", "documentation", "safety"],
  steps: [
    {
      id: "clinical-note-red-flag-scanner",
      type: "mandatory",
      envKey: "CLINICAL_NOTE_RED_FLAG_SCANNER_FLOW_ID"
    }
  ],
  links: {
    deploy: "https://studio.lamatic.ai/template/clinical-note-red-flag-scanner",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/clinical-note-red-flag-scanner"
  }
};

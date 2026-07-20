export default {
  "name": "Sentinel AI Auditor",
  "description": "An adversarial evaluation engine that scores LLM responses for hallucinations, jailbreaks, bias, and refusal consistency.",
  "version": "1.0.0",
  "type": "kit" as const,
  "author": {
    "name": "Arooj Rafique",
    "email": "2024se5@student.uet.edu.pk"
  },
  "tags": ["auditor", "security", "evaluation", "hallucination", "alignment"],
  "steps": [
    {
      "id": "ai-model-auditor-flow",
      "type": "mandatory" as const,
      "envKey": "LAMATIC_WORKFLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit%2Ftree%2Fmain%2Fkits%2Fsentinel-auditor%2Fapps&root-directory=kits/sentinel-auditor/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/sentinel-auditor"
  }
};
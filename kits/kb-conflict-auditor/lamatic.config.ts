export default {
  "name": "KB Conflict Auditor",
  "description": "Finds contradicting facts across a documentation set: code extracts the facts, an AI model judges each pair, and code verifies authority and patches before anything is reported.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Ayush kumar",
    "email": "ayushkumar44344@gmail.com"
  },
  "tags": ["documentation", "audit", "rag", "quality", "github-action"],
  "steps": [
    {
      "id": "audit-kb",
      "type": "mandatory",
      "envKey": "AUDIT_KB_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/kb-conflict-auditor/apps&env=LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,AUDIT_KB_FLOW_ID,GITHUB_TOKEN&envDescription=Your%20Lamatic%20KB%20Conflict%20Auditor%20keys%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/kb-conflict-auditor",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/kb-conflict-auditor"
  }
};

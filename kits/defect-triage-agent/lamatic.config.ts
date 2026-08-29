export default {
  "name": "Manufacturing Defect Triage Agent",
  "description": "Takes a written defect observation and outputs structured severity, root cause hypothesis, recommended action, and reasoning for quality control triage.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Sharvesh A.K.",
    "email": "sharvesh0519@gmail.com"
  },
  "tags": ["manufacturing", "quality-control", "triage", "defect-detection"],
  "steps": [
    {
      "id": "defect-triage",
      "type": "mandatory"
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/defect-triage-agent"
  }
};
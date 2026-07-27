export default {
  name: "Error Log Summariser",
  description: "Turns a raw error log or stack trace into a plain-English root-cause hypothesis, the likely failing component, and concrete next fix steps. Paste a stack trace, get a structured triage summary back.",
  version: '1.0.0',
  type: 'template' as const,
  author: {"name":"Manas Mahato","email":"manasmahato.2004@gmail.com"},
  tags: ["generative","support"],
  steps: [
    { id: "error-log-summariser", type: 'mandatory' as const }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/error-log-summariser"
},
};

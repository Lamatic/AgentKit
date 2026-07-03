export default {
  name: "SRE Incident Postmortem Agent",
  description:
    "A blameless SRE assistant that turns incident notes, alerts, logs, impact details, and current status into a structured postmortem with remediation and prevention actions.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Savan Jadav",
  },
  tags: ["sre", "incident-response", "postmortem", "reliability", "operations"],
  steps: [
    {
      id: "sre-incident-postmortem-agent",
      type: "mandatory" as const,
      envKey: "SRE_POSTMORTEM_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/sre-incident-postmortem-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsre-incident-postmortem-agent%2Fapps&env=LAMATIC_API_KEY,LAMATIC_API_URL,LAMATIC_PROJECT_ID,SRE_POSTMORTEM_FLOW_ID&envDescription=Lamatic%20credentials%20and%20the%20deployed%20SRE%20postmortem%20flow%20ID%20are%20required.",
  },
};

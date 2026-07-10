export default {
  name: "Local Service Booking Agent",
  description:
    "A 3-agent appointment-booking system for local service businesses (salon, barbershop, etc). Intake, Scheduling, and Confirmation agents pass a shared session object through explicit, orchestrated handoffs instead of one monolithic prompt. A Follow-up (reminder) agent is an optional stretch goal, spec'd but not yet built.",
  version: "0.1.0",
  type: "kit" as const,
  author: { name: "Zaid Khan", email: "zk3473893@gmail.com" },
  tags: ["booking", "scheduling", "multi-agent", "customer-service"],
  steps: [
    {
      id: "intake-agent",
      type: "mandatory",
      envKey: "INTAKE_AGENT",
    },
    {
      id: "scheduling-agent",
      type: "mandatory",
      envKey: "SCHEDULING_AGENT",
    },
    {
      id: "confirmation-agent",
      type: "mandatory",
      envKey: "CONFIRMATION_AGENT",
    },
    {
      id: "followup-agent",
      type: "optional",
      envKey: "FOLLOWUP_AGENT",
    },
  ],
  links: {
    demo: "",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/zaid-booking-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fzaid-booking-agent%2Fapps&env=INTAKE_AGENT,SCHEDULING_AGENT,CONFIRMATION_AGENT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20flow%20IDs%20and%20API%20credentials%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/zaid-booking-agent",
    docs: "",
  },
};

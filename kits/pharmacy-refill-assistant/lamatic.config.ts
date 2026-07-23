export default {
  "name": "Pharmacy Refill Assistant",
  "description": "An AI agent that helps patients check medication refill eligibility and status.",
  "version": "1.0.0",
  "type": "template" as const,
  "author": {
    "name": "Utsav Panchal",
    "email": "utsavpanchal2756@gmail.com"
  },
  "tags": ["healthcare", "pharmacy", "customer-support"],
  "steps": [
    {
      "id": "pharmacy-agent",
      "type": "mandatory" as const
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/pharmacy-refill-assistant"
  }
};

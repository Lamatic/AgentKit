export default {
  name: "Embedded Chat",
  description: "It uses intelligent workflows to index PDFs and webpages, then provides an interactive chat interface where users can ask questions about their documents through a modern Next.js interface.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["embedded","support"],
  steps: [
    {
        "id": "embedded-chatbot-pdf-indexation",
        "type": "mandatory",
        "envKey": "EMBEDDED_CHATBOT_PDF_INDEXATION"
    },
    {
        "id": "embedded-chatbot-websites-indexation",
        "type": "mandatory",
        "envKey": "EMBEDDED_CHATBOT_WEBSITES_INDEXATION"
    },
    {
        "id": "embedded-chatbot-chatbot",
        "type": "mandatory",
        "envKey": "EMBEDDED_CHATBOT_CHATBOT"
    },
    {
        "id": "embedded-chatbot-resource-deletion",
        "type": "mandatory",
        "envKey": "EMBEDDED_CHATBOT_RESOURCE_DELETION"
    }
],
  links: {
    "demo": "https://agent-kit-embedded-chat.vercel.app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/embed-chat",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fembed-chat%2Fapps&env=EMBEDDED_CHATBOT_PDF_INDEXATION,EMBEDDED_CHATBOT_WEBSITES_INDEXATION,EMBEDDED_CHATBOT_RESOURCE_DELETION,EMBEDDED_CHATBOT_CHATBOT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Config%Embedded%20Chat%20keys%20and%20Blob%20token%20are%20required.&envLink=https://lamatic.ai/templates/agentkits/embed/agent-kit-embed-chat",
    "docs": "https://lamatic.ai/templates/agentkits/embed/agent-kit-embed-chat"
},
};

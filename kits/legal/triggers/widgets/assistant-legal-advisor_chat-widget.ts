// Widget settings: Chat Widget (chat)
// Flow: assistant-legal-advisor
// Widget UI/appearance — domains, colors, layout.

export default {
  "chatConfig": {
    "botName": "Legal Assistant Bot",
    "imageUrl": "https://raw.githubusercontent.com/Lamatic/AgentKit/main/kits/assistant/legal/public/icon-light-32x32.png",
    "position": "right",
    "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
    "displayMode": "popup",
    "placeholder": "Type your legal question",
    "suggestions": [
      "My landlord did not return my security deposit in Goa, India. what can I do",
      "My employer in New York, USA has not paid salary for two months what are my options",
      "I received a legal notice in Japan what should I do next"
    ],
    "errorMessage": "Oops something went wrong. Please try again. If it keeps happening, refresh the page and try once more.",
    "hideBranding": false,
    "primaryColor": "#ef4444",
    "headerBgColor": "#000000",
    "greetingMessage": "Hi, I am Legal Assistant Bot. I can share general legal information. Please tell me your country and state or province.",
    "headerTextColor": "#FFFFFF",
    "showEmojiButton": true,
    "suggestionBgColor": "#f1f5f9",
    "showAdvancedColors": true,
    "userMessageBgColor": "#FEF2F2",
    "agentMessageBgColor": "#f1f5f9",
    "suggestionTextColor": "#334155",
    "userMessageTextColor": "#d12323",
    "agentMessageTextColor": "#334155"
  },
  "domains": [
    "http://localhost:3000"
  ]
};

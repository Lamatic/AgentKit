export default {
  "name": "Scam Shield",
  "description": "A fraud-awareness agent for Indian UPI/banking users. Retrieves known scam patterns via RAG and classifies suspicious messages with a risk score, red flags, and recommended action, routing users to official reporting channels (cybercrime.gov.in / helpline 1930).",
  "version": "1.0.0",
  "type": "bundle",
  "author": {
    "name": "Raz",
    "email": "skrazzakhussain@gmail.com"
  },
  "tags": ["fraud-detection", "banking", "upi", "rag", "safety", "india"],
  "steps": [
    {
      "id": "index-scam-patterns",
      "type": "mandatory"
    },
    {
      "id": "scam-message-triage",
      "type": "mandatory"
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/scam-shield"
  }
};
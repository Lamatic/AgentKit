export default {
  "name": "Insurance Jargon Translator",
  "description": "Translates confusing insurance policy clauses into plain English, with a category, a real-world example scenario, and why the clause exists.",
  "version": "1.0.0",
  "type": "template" as const,
  "author": {
    "name": "Saktheeswari P",
    "email": "p.sakthee@gmail.com"
  },
  "tags": ["insurance", "generative", "text"],
  "steps": [
    {
      "id": "insurance-jargon-translator",
      "type": "mandatory" as const
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/insurance-jargon-translator"
  }
};
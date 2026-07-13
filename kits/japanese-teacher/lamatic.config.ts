export default {
  "name": "Context Based Language Learning",
  "description": "An AI-powered contextual Japanese learning assistant that generates custom reading lessons and quizzes.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Metin Ege Aral",
    "email": "metinegearal@gmail.com"
  },
  "tags": ["language-learning", "context-based", "education", "japanese"],
  "steps": [
    {
      "id": "lesson",
      "type": "mandatory",
      "workflowId": "d270b86a-d948-440b-b523-45b6ee4af49a"
    },
    {
      "id": "quiz",
      "type": "mandatory",
      "workflowId": "62ca9b42-7242-4521-bf11-9439d10faeff"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/japanese-teacher/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/japanese-teacher"
  }
};
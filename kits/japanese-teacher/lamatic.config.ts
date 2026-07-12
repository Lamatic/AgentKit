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
      "type": "mandatory"
    },
    {
      "id": "quiz",
      "type": "mandatory"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/metinegearal/AgentKit&root-directory=kits/japanese-teacher/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/japanese-teacher"
  }
};

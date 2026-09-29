export default {
  "name": "AI News Carousel",
  "description": "Pulls the latest AI developments from arXiv, GitHub, Hacker News, and Gemini search grounding, ranks and dedupes them, drafts an Instagram carousel with sourced images and a caption, and delivers it to a human review dashboard.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Vishwa Nanavati",
    "email": "vpnanavati@gmail.com"
  },
  "tags": ["ai-news", "content-generation", "instagram", "automation"],
  "steps": [
    {
      "id": "run-execute-pipeline",
      "type": "mandatory"
    },
    {
      "id": "collect-sources",
      "type": "mandatory"
    },
    {
      "id": "visual-planner",
      "type": "mandatory"
    },
    {
      "id": "draft-content",
      "type": "mandatory"
    },
    {
      "id": "curate-pick",
      "type": "mandatory"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/ai-news-carousel/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/ai-news-carousel",
    "demo": "https://ai-digest-app-two.vercel.app/"
  }
};

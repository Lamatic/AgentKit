export default {
  "name": "News-digest",
  "description": "Scrapes the tech news daily via Firecrawl, ranks and deduplicates stories with an LLM, and emails a formatted digest.",
  "version": "1.0.0",
  "type": "template",
  "author": {
    "name": "Vedanth Rao T",
    "email": "xilinx36@gmail.com"
  },
  "tags": ["news", "digest", "automation", "email", "firecrawl"],
  "steps": [
    {
      "id": "news-digest",
      "type": "mandatory"
    }
  ],
  "links": {
    "deploy": "",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/news-digest"
  }
};

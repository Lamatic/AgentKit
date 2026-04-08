export default {
  name: "Internal Assistant",
  description: "Build an internal chatbot that finds precise answers within your company’s knowledge base.",
  version: '1.0.0',
  type: 'bundle' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["startup","document"],
  steps: [
    {
        "id": "data-source",
        "type": "any-of",
        "options": [
            {
                "id": "gdrive"
            },
            {
                "id": "gsheet"
            },
            {
                "id": "onedrive"
            },
            {
                "id": "postgres"
            },
            {
                "id": "s3"
            },
            {
                "id": "scraping-indexation"
            },
            {
                "id": "sharepoint"
            },
            {
                "id": "crawling-indexation"
            }
        ],
        "minSelection": 1,
        "maxSelection": 1
    },
    {
        "id": "assistant",
        "type": "any-of",
        "options": [
            {
                "id": "knowledge-chatbot"
            },
            {
                "id": "slack-assistant"
            },
            {
                "id": "teams-assistant"
            }
        ],
        "prerequisiteSteps": [
            "data-source"
        ],
        "minSelection": 1,
        "maxSelection": 1
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/assistants"
},
};

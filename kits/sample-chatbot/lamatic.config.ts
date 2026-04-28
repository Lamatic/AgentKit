export default {
  name: "Knowledge Chatbot",
  description: "A chat bundle that combines data source indexing with a knowledge chatbot interface.",
  version: '1.0.0',
  type: 'bundle' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["support","document"],
  steps: [
    {
        "id": "data_source",
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
        "id": "knowledge-chatbot",
        "type": "mandatory",
        "prerequisiteSteps": [
            "data_source"
        ]
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/sample-chatbot"
},
};

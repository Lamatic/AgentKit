export default {
  name: "RAG (Retrieval-Augmented Generation)",
  description: "Generate accurate responses using large volumes of structured and unstructured data",
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
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/knowledge-chatbot"
},
};

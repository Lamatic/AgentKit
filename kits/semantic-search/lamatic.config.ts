export default {
  name: "Semantic Search",
  description: "Perform natural language search ( aka vector search ) across structured and unstructured data effortlessly.",
  version: '1.0.0',
  type: 'bundle' as const,
  author: {"name":"Naitik Kapadia","email":"naitikk@lamatic.ai"},
  tags: ["document","support"],
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
        "id": "semantic-search",
        "type": "mandatory",
        "prerequisiteSteps": [
            "data_source"
        ]
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/semantic-search"
},
};

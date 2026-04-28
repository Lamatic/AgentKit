export default {
  name: "Deep Research",
  description: "Customized agentic deep research across both internal and external data sources.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Lamatic AI","email":"info@lamatic.ai"},
  tags: ["agentic","reasoning","growth"],
  steps: [
    {
        "id": "agentic-reasoning-generate-steps",
        "type": "mandatory",
        "envKey": "AGENTIC_REASONING_GENERATE_STEPS"
    },
    {
        "id": "step2",
        "type": "any-of",
        "options": [
            {
                "id": "agentic-reasoning-search-web",
                "prerequisiteSteps": [
                    "agentic-reasoning-generate-steps"
                ],
                "envKey": "AGENTIC_REASONING_SEARCH_WEB"
            },
            {
                "id": "agentic-reasoning-data-source",
                "prerequisiteSteps": [
                    "agentic-reasoning-generate-steps",
                    "data_source_prerequisite"
                ],
                "envKey": "AGENTIC_REASONING_DATA_SOURCE"
            }
        ],
        "minSelection": 1,
        "maxSelection": 2
    },
    {
        "id": "data_source_prerequisite",
        "type": "any-of",
        "appearsIf": {
            "selectedStepIds": [
                "agentic-reasoning-data-source"
            ]
        },
        "options": [
            {
                "id": "gdrive",
                "envKey": "AGENTIC_REASONING_GDRIVE"
            },
            {
                "id": "gsheet",
                "envKey": "AGENTIC_REASONING_GSHEET"
            },
            {
                "id": "onedrive",
                "envKey": "AGENTIC_REASONING_ONEDRIVE"
            },
            {
                "id": "postgres",
                "envKey": "AGENTIC_REASONING_POSTGRES"
            },
            {
                "id": "s3",
                "envKey": "AGENTIC_REASONING_S3"
            },
            {
                "id": "scraping-indexation",
                "envKey": "AGENTIC_REASONING_SCRAPING_INDEXATION"
            },
            {
                "id": "sharepoint",
                "envKey": "AGENTIC_REASONING_SHAREPOINT"
            }
        ],
        "minSelection": 1,
        "maxSelection": 1
    },
    {
        "id": "agentic-reasoning-final",
        "type": "mandatory",
        "envKey": "AGENTIC_REASONING_FINAL",
        "prerequisiteSteps": [
            "step2"
        ]
    }
],
  links: {
    "demo": "https://agent-kit-reasoning.vercel.app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/deep-search",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdeep-search%2Fapps",
    "docs": "https://lamatic.ai/templates/agentkits/agentic/agent-kit-deep-search"
},
};

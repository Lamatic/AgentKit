export default {
  name: "GitHub Manager",
  description: "Extract information from the repository docs and use that to answer questions related to the project, automate issue triaging",
  version: '1.0.0',
  type: 'bundle' as const,
  author: {"name":"Vasistha Yadav","email":"vasisthayadav58@gmail.com"},
  tags: ["document","automation"],
  steps: [
    {
        "id": "docs-ingestion",
        "type": "mandatory"
    },
    {
        "id": "classifier",
        "type": "mandatory",
        "prerequisiteSteps": [
            "data-source"
        ]
    }
],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/github-manager"
},
};

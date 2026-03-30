# Bundle Contribution Guide

> [Quickstart](./quickstart.md) · [Main Contributing Guide](../CONTRIBUTING.md)

A **bundle** is a collection of multiple related Lamatic flows packaged together with a shared configuration. Bundles don't include a web application — they are flow-only packages that users import directly into their Lamatic workspace.

Bundles are ideal when you have several flows that work together (e.g., a data source indexation flow paired with a chatbot flow).

**Reference implementation:** [`bundles/sample/chatbot/`](../bundles/sample/chatbot/)

---

## Prerequisites

Before following this guide, complete **Steps 1–3** in the [main Contributing Guide](../CONTRIBUTING.md#step-1-fork-the-repository):

1. Fork and clone the repository
2. Build your flow(s) in Lamatic Studio
3. Export your flow files and API keys

Bundles are flow-only — no Node.js, npm, or Vercel setup is needed.

---

## Step 1: Create Your Bundle Folder

### 1.1 Folder Structure

```
bundles/<bundle-name>/
├── config.json            # Bundle metadata + step definitions
├── README.md              # What the bundle does and how to use it
└── flows/
    ├── <flow-1>/
    │   ├── config.json    # Flow graph (nodes + edges)
    │   ├── inputs.json    # Input schema
    │   ├── meta.json      # Flow metadata
    │   └── README.md      # Flow documentation
    └── <flow-2>/
        ├── config.json
        ├── inputs.json
        ├── meta.json
        └── README.md
```

Use **kebab-case** for all folder names (e.g., `knowledge-chatbot`, `document-parsing`).

### 1.2 Create From the Sample

```bash
# Copy the sample bundle as a starting point
cp -R bundles/sample/chatbot bundles/<bundle-name>

# Remove sample flow directories and add your own
rm -rf bundles/<bundle-name>/flows/*
```

---

## Step 2: Configure config.json

The bundle `config.json` defines metadata and orchestration steps. It tells the platform which flows are included, which are required, and which offer user choices.

### 2.1 Full Example

```json
{
    "name": "Your Bundle Name",
    "description": "Brief description of what this bundle does.",
    "tags": ["📞 Support", "📄 Document"],
    "author": {
        "name": "Your Name",
        "email": "your@email.com"
    },
    "steps": [
        {
            "id": "data_source",
            "type": "any-of",
            "options": [
                { "id": "gdrive" },
                { "id": "gsheet" },
                { "id": "postgres" }
            ],
            "minSelection": 1,
            "maxSelection": 1
        },
        {
            "id": "knowledge-chatbot",
            "type": "mandatory",
            "prerequisiteSteps": ["data_source"]
        }
    ],
    "integrations": [],
    "features": [],
    "demoUrl": "",
    "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/bundles/<bundle-name>",
    "deployUrl": "",
    "documentationUrl": ""
}
```

### 2.2 Step Types

| Type | Purpose | Key Fields |
|------|---------|------------|
| `"mandatory"` | Required flow — always included | `id`, `prerequisiteSteps` (optional) |
| `"any-of"` | User picks from a list of options | `id`, `options`, `minSelection`, `maxSelection` |

**`"any-of"` steps** are used when users choose between alternatives (e.g., pick a data source type). Each option's `id` must match a flow folder name under `flows/`.

**`"mandatory"` steps** are always included. Use `prerequisiteSteps` to specify dependencies (e.g., the chatbot flow depends on a data source being selected first).

### 2.3 Naming Alignment

Flow folder names must match the step/option IDs in `config.json`:

```
config.json step option: { "id": "gdrive" }
  → flows/gdrive/

config.json step: { "id": "knowledge-chatbot" }
  → flows/knowledge-chatbot/
```

---

## Step 3: Add Your Exported Flows

1. Create a directory for each flow under `flows/`:
   ```bash
   mkdir -p bundles/<bundle-name>/flows/<flow-name>
   ```

2. Copy your exported flow files:
   ```bash
   cp -R ~/Downloads/exported-flow/* bundles/<bundle-name>/flows/<flow-name>/
   ```

Each flow directory must contain these 4 files:
- `config.json` — Flow graph (nodes + edges)
- `inputs.json` — Input schema for dynamic nodes
- `meta.json` — Flow metadata (name, description, tags)
- `README.md` — Auto-generated flow documentation

> Do not hand-edit flow `config.json` files. Re-export from Lamatic Studio if changes are needed.

---

## Step 4: Write Your README

Your bundle's root `README.md` should include:

1. **Deploy on Lamatic** button (link to your bundle's studio import URL)
2. **About This Bundle** — what it does, what problem it solves
3. **Included Flows** — list each flow and its purpose
4. **Files Included** — brief note about the flow files (config.json, inputs.json, meta.json)
5. **Usage** — how to import and configure in Lamatic workspace
6. **Required Configurations** — any credentials or integrations needed

See the sample bundle README for reference: [`bundles/sample/chatbot/README.md`](../bundles/sample/chatbot/README.md)

---

## Step 5: Open a Pull Request

### 5.1 Push Your Branch

```bash
git checkout -b feat/<bundle-name>-bundle
git add bundles/<bundle-name>
git commit -m "feat: Add <bundle-name> bundle"
git push origin feat/<bundle-name>-bundle
```

### 5.2 PR Checklist

```markdown
- [ ] Folder structure follows `bundles/<bundle-name>/`
- [ ] `README.md` documents what the bundle does
- [ ] `config.json` is present with correct flow references
- [ ] All flows exported in `flows/` folder with config.json, inputs.json, meta.json, README.md
- [ ] Flow folder names match step/option IDs in config.json
- [ ] No secrets committed
```

---

## Examples & References

| Resource | Link |
|----------|------|
| Sample Bundle (complete reference) | [`bundles/sample/chatbot/`](../bundles/sample/chatbot/) |
| Bundle config.json | [`bundles/sample/chatbot/config.json`](../bundles/sample/chatbot/config.json) |
| Bundle README | [`bundles/sample/chatbot/README.md`](../bundles/sample/chatbot/README.md) |
| Knowledge Chatbot | [`bundles/knowledge-chatbot/`](../bundles/knowledge-chatbot/) |

---

## Need Help?

- Check the [Troubleshooting section](../CONTRIBUTING.md#troubleshooting) in the main contributing guide
- Ask in [GitHub Discussions](https://github.com/Lamatic/AgentKit/discussions)
- Review [Lamatic Docs](https://lamatic.ai/docs)

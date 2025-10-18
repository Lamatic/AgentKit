# Agent Kit Sheets by Lamatic.ai

<p align="center">
  <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmc5NmFnd2NuNDEzcmRiMmltcjFqdGdtbmRiYWUzdTI3NmRuNXZiZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/iTvwJK5Tema4GtJXwt/giphy.gif" alt="Demo" />
</p>

<p align="center">
  <a href="https://agent-kit-sheets.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" />
  </a>
</p>


**Agent Kit Sheets** is an AI-powered spreadsheet application built with [Lamatic.ai](https://lamatic.ai). It combines the familiar spreadsheet interface with intelligent AI workflows to transform, analyze, categorize, and summarize your data through a modern Next.js interface.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=templates/embed/sheets&env=LAMATIC_API_KEY&envDescription=Lamatic%20API%20key%20is%20required.&envLink=https://lamatic.ai/docs/keys#required-api-keys)

---

## Lamatic Setup (Pre and Post)

Before running this project, you must build and deploy the flow in Lamatic, then wire its config into this codebase.

Pre: Build in Lamatic
1. Sign in or sign up at https://app.lamatic.ai  
2. Create a project (if you don’t have one yet)  
3. Click “+ New Flow”  
4. Choose “Build from Use Cases” and select the kit closest to your needs  
5. Configure providers/tools/inputs as prompted  
6. Deploy the flow in Lamatic and verify it runs  
7. Export the lamatic-config.json from your deployed flow

Post: Wire into this repo
1. Place lamatic-config.json in the path this repo expects (commonly ./lamatic-config.json; if different, follow this README’s instructions)  
2. Create a .env file and set:
   - LAMATIC_API_KEY=your_lamatic_key
   - Any other provider keys your flow requires (e.g., OPENAI_API_KEY, ANTHROPIC_API_KEY)
3. Install and run locally:
   - npm install
   - npm run dev
4. Deploy (Vercel recommended):
   - Import your repo, set the project’s Root Directory (if applicable)
   - Add env vars in Vercel (same as your .env)
   - Deploy and test your live URL

Notes
- If this repo contains a lamatic-config.json, it’s a placeholder. Replace it with your exported config.  
- Coming soon: single-click export and “Connect Git” in Lamatic to push config directly to your repo.

---

## 🔑 Setup

### Required Keys and Config

You'll need two things to run this project locally:

1. **Lamatic API Key** → get it from your [Lamatic account](https://lamatic.ai)
2. **lamatic-config.json payload** → copy it from your Lamatic Studio project (this defines the AI workflows)
   ⚠️ Note: The `lamatic-config.json` in this repo is just a **dummy example**.
   Replace it with your own exported config from Lamatic Studio.
   

| Item                    | Purpose                                      | Where to Get It                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------- |
| Lamatic API Key         | Authentication for Lamatic AI APIs           | [lamatic.ai](https://lamatic.ai)                |
| Lamatic Config          | Defines your AI transformation workflows     | From your Lamatic Studio Agent Kit Project      |

### 1. Environment Variables

Create `.env` with:

```
# Lamatic
LAMATIC_API_KEY=your_lamatic_key

# Spreadsheet Limits (defaults shown)
## Use 'inf' or '0' for unlimited in any of the above variables
NEXT_PUBLIC_MAX_ROWS=5
NEXT_PUBLIC_MAX_COLS=3
NEXT_PUBLIC_MAX_SHEETS=1
NEXT_PUBLIC_POLLING_INTERVAL=10
```

### 2. Config File

Copy your project payload into [`lamatic-config.json`](./lamatic-config.json) in the repo root.
(Export this directly from your Lamatic Studio project and paste it into the file.)

### 3. Install & Run

```
npm install
npm run dev
# Open http://localhost:3000
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut                  | Action                    |
| ------------------------- | ------------------------- |
| `Cmd/Ctrl + Shift + R`    | Add new row               |
| `Cmd/Ctrl + Shift + C`    | Add new column            |
| `Cmd/Ctrl + Shift + N`    | Create new sheet          |

---

## 📂 Repo Structure

```
/actions
 └── orchestrate.ts        # Lamatic workflow orchestration
/app
 ├── page.tsx              # Main spreadsheet interface
 └── api
     └── webhook
         └── ai-result     # Webhook for AI processing results
/components
 ├── spreadsheet-grid.tsx  # Main grid component with resizable columns
 ├── editable-cell.tsx     # Cell editing logic
 ├── markdown-cell.tsx     # Markdown rendering in cells
 ├── add-column-panel.tsx  # Column creation popover
 ├── add-column-dialog.tsx # AI column configuration dialog
 ├── edit-column-dialog.tsx # Column editing dialog
 ├── csv-upload-dialog.tsx # CSV import interface
 ├── sheet-tabs.tsx        # Sheet navigation tabs
 ├── workbook-header.tsx   # Application header
 └── ui/                   # shadcn/ui components
/lib
 ├── store.ts              # Zustand state management
 ├── types.ts              # TypeScript type definitions
 ├── lamatic-client.ts     # Lamatic SDK client
 └── utils.ts              # Utility functions
/lamatic-config.json       # Lamatic flow configuration
/package.json              # Dependencies & scripts
```

---

## 🤝 Contributing

We welcome contributions! Open an issue or PR in this repo.

---

## 📜 License

MIT License – see [LICENSE](./LICENSE).
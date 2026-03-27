## Intelligent Watchdog by Lamatic.ai

<p align="center"><a href="https://intelligent-watchdog.vercel.app/" target="_blank"><img src="https://img.shields.io/badge/Live%20Demo-black?style=for-the-badge" alt="Live Demo" /></a></p>


Intelligent Watchdog is an autonomous AI-powered competitor monitoring system. It leverages Lamatic.ai and Firecrawl to track rival websites, detect shifts in pricing or features, and generate high-impact "Sales Battle Cards" to help sales teams counter competitor moves in real-time.Lamatic Setup (Pre and Post)Before running this project, you must build and deploy the flow in Lamatic to enable the scraping and analysis logic.Pre: Build in LamaticSign in or sign up at lamatic.ai.Create a new project.Click “+ New Flow” and create a flow with the following nodes:Webhook Trigger: To receive competitor URLs.Firecrawl Scraper: To extract clean text from landing pages.LLM Node: To compare "Last Known Data" vs. "Current Scrape" and generate the analysis.Deploy the flow and obtain your API keys from the Lamatic Studio.Post: Wire into this repoCreate a .env.local file in the root directory.Add your Lamatic keys (Project ID, API Key, and Flow ID).Install and run locally:npm installnpm run devDeploy to Vercel:Import your repo and set the Root Directory to kits/automation/Watchdog.Add your environment variables in the Vercel Dashboard.🔑 Setup & Required KeysTo run this project locally, you will need the following credentials from your Lamatic dashboard:ItemPurposeWhere to Get ItLAMATIC_API_KEYAuthentication for Lamatic GraphQL APIslamatic.ai SettingsWATCHDOG_FLOW_IDIdentifies your specific Watchdog logic flowLamatic Flow EditorLAMATIC_PROJECT_IDLinks the app to your specific project workspaceLamatic Project Settings.


1. Environment VariablesCreate a .env.local file with the following:Bash# Lamatic Configuration

WATCHDOG_FLOW_ID = "811a44e5-a5ab-471e-9b1e-9e994b49554f"
LAMATIC_API_URL = "https://harshsorganization186-watchdog623.lamatic.dev/graphql"
LAMATIC_PROJECT_ID = "be77e472-8fda-41f1-a52d-575cf5b1bb3f"
LAMATIC_API_KEY = "36dfd9791177adaee07cb4976a9e40f4"

2. Install & RunBashnpm install
npm run dev


## The app will be available at: http://localhost:3000


📂 Repo StructurePlaintext/app
 ├── api/analyse/route.ts   # Backend API handling Lamatic GraphQL calls
 └── page.tsx               # Main Dashboard UI with Markdown rendering
/components
 └── ui/                    # Shared shadcn/ui components (Loader, Buttons)
/flows
 └── watchdog-flow/  # Lamatic Flow Metadata
     ├── config.json        # Node configurations and output mapping
     ├── inputs.json        # JSON Schema for competitor data
     └── meta.json          # Marketplace metadata (icon, category)
/public                     # Static assets and icons
/package.json               # Project dependencies (react-markdown, lucide-react)


🛡️ Core FeaturesReal-time Web Scraping: Deep-scans competitor URLs to extract pricing tables and feature lists.Smart Comparison: AI detects if a change is "meaningful" to avoid noise and only reports critical shifts.Battle Card Generation: Provides "Hook vs. Catch" talking points for sales reps.Responsive UI: Dark-themed, mobile-friendly dashboard with professional Markdown styling.

🤝 ContributingWe welcome contributions to make the Watchdog even smarter! Feel free to open an issue or submit a PR.

## 📜 License

MIT License – see [LICENSE](./LICENSE).

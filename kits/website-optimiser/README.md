# WebRevive AI 🌐

Autonomous website audit and cold outreach agent. Paste any business website URL to receive a complete SEO audit, performance analysis, UI/UX review, competitor research, AI redesign suggestions, personalized cold email sequence, LinkedIn outreach, and a full business proposal.

## Setup Instructions

1. **Deploy to Lamatic**
   - Create a new flow in Lamatic Studio using the `webrevive-orchestrator` flow definition.
   - Get your Flow ID, API Key, and Project ID from Lamatic Studio.

2. **Run Locally**

   ```sh
   cd apps
   cp .env.example .env.local 
   # Fill in your .env.local with your Lamatic credentials and WEBREVIVE_FLOW_ID
   bun install
   bun run dev
   ```

3. **Deploy**
   Deploy the `apps` folder to Vercel to share it with the world!

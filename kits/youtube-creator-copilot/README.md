# YouTube Creator Copilot 🎥

An AI-powered copilot for YouTube creators that generates viral video ideas, scripts, and thumbnail concepts based on your niche and target audience.

## Setup Instructions

1. **Deploy to Lamatic**
   - Create a new flow in Lamatic Studio using the `agentic-youtube-creator` flow definition.
   - Get your Flow ID, API Key, and Project ID from Lamatic Studio.

2. **Run Locally**
   ```sh
   cd apps
   cp .env.example .env.local
   # Fill in your .env.local with your Lamatic credentials
   bun install
   bun run dev
   ```

3. **Deploy**
   Deploy the `apps` folder to Vercel to share it with the world!

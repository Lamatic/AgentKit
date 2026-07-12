# 🛡️ Context-Aware Blocker Kit

An AI-powered Chrome Extension and Next.js backend that blocks websites based on context, not just URLs. Built with [Lamatic.ai](https://lamatic.ai).

## 🏗️ Architecture
This kit follows the production "Golden Standard" for AI extensions:
1. **Chrome Extension**: The lightweight client that reads page context.
2. **Next.js API**: The secure backend proxy that holds the Lamatic API keys.
3. **Lamatic Flow**: The AI brain that makes the ALLOW/BLOCK decision.

## 🚀 Setup Instructions

### 1. Build the AI Flow in Lamatic
1. Go to [studio.lamatic.ai](https://studio.lamatic.ai) and create a new project.
2. Create a new flow named `content-classification`.
3. Set up an **API Request** node → **InstructorLLMNode** → **API Response**.
4. Deploy the flow and export it.
5. Get your `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, and `FLOW_ID` from the dashboard.

### 2. Run the Next.js Backend
1. Open the `apps/` directory in your terminal.
2. Copy `.env.example` to `.env.local` and paste your Lamatic keys.
3. Run `npm install` and `npm run dev`.
4. The secure API proxy is now running on `http://localhost:3000/api/classify`.

### 3. Load the Chrome Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select the `apps/extension` folder.
5. The Lamatic Context Blocker is now active!

## 🛠️ The "Strict Bouncer" Feature
This extension includes a hardcore productivity hack: If a user tries to open `chrome://extensions` to disable the blocker, the extension's background service worker will instantly close the tab.

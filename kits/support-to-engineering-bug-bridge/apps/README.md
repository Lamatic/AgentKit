# Bug Bridge Dashboard

A Next.js dashboard that visualizes accumulated support-ticket bug clusters over time, driven by the Bug Bridge Lamatic flows.

## Prerequisites

- The `bug-bridge-list-flow` must be deployed in Lamatic Studio.
- Node.js 18+

## Setup

1. Copy the `.env.example` file in this directory to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the required environment variables in `.env.local`:
   - `LAMATIC_API_URL`
   - `LAMATIC_PROJECT_ID`
   - `LAMATIC_API_KEY`
   - `BUG_BRIDGE_LIST_FLOW_ID`
   - `NEXT_PUBLIC_GITHUB_REPO_OWNER`
   - `NEXT_PUBLIC_GITHUB_REPO_NAME`

*(Note: Ensure your `LAMATIC_API_URL` matches your project, e.g. `https://api.lamatic.ai/v1` or your custom domain).*

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

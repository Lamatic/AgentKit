# Outreach Personalizer - Next.js Reference App

This is the reference web application for the **Outreach Personalizer** kit. It provides a modern, responsive web dashboard where job candidates can generate hyper-personalized cold outreach emails based on a target company website URL, founder's LinkedIn URL, and the candidate's background.

The application triggers a deployed Lamatic.ai AI flow via Next.js Server Actions, keeping all API credentials secure on the server side.

## Features

- **Input Form**: Clean fields for the company website, founder LinkedIn profile, and candidate background context.
- **Real-Time Step Progression**: Dynamic feedback showing the current step of the underlying agent flow.
- **Copy-to-Clipboard**: Quick copy functionality for the generated cold outreach pitch.
- **Error Interception**: Graceful handling of network failures or flow timeout errors.

## Prerequisites

- Node.js v18.0.0 or higher
- npm, yarn, or pnpm

## Environment Setup

Create a `.env.local` file in this directory (`apps/`), or copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Define the following environment variables inside `.env.local`:

```env
# The secret credential used to authenticate your client requests (do not share or commit)
LAMATIC_API_KEY=your_lamatic_api_key

# The project identifier in the Lamatic Cloud Studio
LAMATIC_PROJECT_ID=your_lamatic_project_id

# The base URL endpoint for your deployed project (e.g. https://<org>-<project>.lamatic.dev)
LAMATIC_API_URL=your_lamatic_api_url

# The UUID indicating which specific flow to trigger (e.g. Outreach Personalizer)
FLOW_ID=your_deployed_flow_id
```

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Access the dashboard**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

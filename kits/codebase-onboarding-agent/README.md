# Codebase Onboarding Agent (repo-analyzer)

This AgentKit provides a powerful Codebase Onboarding Agent that analyzes a GitHub repository and generates onboarding materials tailored to specific developer roles using [Lamatic](https://lamatic.dev).

## Architecture

This kit contains a Next.js application (located in the `apps` directory) which provides a user interface for submitting repository details to the Lamatic execution engine.

## Setup Instructions

### Prerequisites

To run this kit, you must configure environment variables for Lamatic integration. Create a `.env.local` or `.env` file in the `apps` directory (you can copy `.env.example`):

```env
LAMATIC_PROJECT_API_KEY=your_lamatic_api_key_here
LAMATIC_PROJECT_ENDPOINT=your_lamatic_endpoint_here
LAMATIC_PROJECT_ID=your_project_id_here
LAMATIC_FLOW_ID=your_flow_id_here
```

## Environment Variables

This kit requires the following environment variables to authenticate and communicate with your deployed Lamatic flow:

| Variable | Description | Where to Find It |
|----------|-------------|------------------|
| `LAMATIC_PROJECT_API_KEY` | Your Lamatic API Key | Lamatic Studio: **Settings → API Keys** |
| `LAMATIC_PROJECT_ENDPOINT` | Your Lamatic GraphQL endpoint | Lamatic Studio: **Settings → API Docs Button → API → Endpoint** |
| `LAMATIC_PROJECT_ID` | Your unique Lamatic project ID | Lamatic Studio: **Settings → Project → Project ID** |
| `LAMATIC_FLOW_ID` | The ID of the deployed repo-analyzer flow | Lamatic Studio: **Flow → Details Panel → Flow ID** |

### Running the Application

1. Navigate to the `apps` directory:
   ```bash
   cd apps
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Enter a public GitHub repository URL.
2. Specify the target developer role (e.g., "Frontend Engineer", "Backend Developer").
3. Submit the form to trigger the Lamatic workflow.
4. Wait for the asynchronous analysis to complete and view the generated onboarding materials.

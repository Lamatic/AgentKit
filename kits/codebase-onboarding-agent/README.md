# Codebase Onboarding Agent (repo-analyzer)

This AgentKit provides a powerful Codebase Onboarding Agent that analyzes a GitHub repository and generates onboarding materials tailored to specific developer roles using [Lamatic](https://lamatic.dev).

## Architecture

This kit contains a Next.js application (located in the `apps` directory) which provides a user interface for submitting repository details to the Lamatic execution engine.

## Setup Instructions

### Prerequisites

You will need to configure environment variables for Lamatic integration. Create a `.env.local` or `.env` file in the `apps` directory:

```env
LAMATIC_PROJECT_API_KEY=your_lamatic_api_key_here
LAMATIC_API_URL=your_lamatic_endpoint_here
LAMATIC_PROJECT_ID=your_project_id_here
LAMATIC_FLOW_ID=your_flow_id_here
```

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

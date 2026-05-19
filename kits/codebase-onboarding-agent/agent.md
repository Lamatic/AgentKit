# Codebase Onboarding Agent (repo-analyzer)

## Agent Overview
The Codebase Onboarding Agent is an AI-powered tool designed to analyze public GitHub repositories and automatically generate comprehensive, role-specific onboarding materials. By leveraging the Lamatic execution engine, it parses the target codebase and constructs documentation, architectural overviews, and getting-started guides tailored to the user's specific developer role (e.g., Frontend Engineer, Backend Developer, DevOps).

## Purpose
The primary goal of this agent is to drastically reduce the time it takes for a new developer to understand an unfamiliar codebase. Instead of manually sifting through thousands of lines of code and fragmented documentation, the agent provides a synthesized, focused summary of the most relevant parts of the repository based on the developer's responsibilities.

## Flow Descriptions
1. **Input Collection**: The user provides a valid public GitHub repository URL and specifies their target developer role through the Next.js frontend interface.
2. **Request Initialization**: The application validates the inputs and dispatches an asynchronous request to the Lamatic execution engine using the provided Lamatic Flow ID and Project API Key.
3. **Repository Analysis**: The Lamatic-hosted agent fetches the repository, analyzes its file structure, reads key files, and uses LLMs to synthesize the information.
4. **Polling & Retrieval**: The frontend asynchronously polls the Lamatic API (using the `requestId`) until the flow completes.
5. **Result Presentation**: Once completed, the tailored onboarding documentation is unwrapped and displayed to the user in the frontend.

## Guardrails
- **Public Repositories Only**: The agent currently only supports public GitHub repositories.
- **URL Validation**: The provided repository URL is normalized and strictly validated to ensure it points to a valid `github.com` domain.
- **Role Specificity**: A developer role must be provided to ensure the generated documentation is focused and actionable, preventing overly broad or generic analysis.
- **Error Handling**: The integration includes robust timeout and error handling, ensuring that if the Lamatic flow fails or takes too long, the user is notified with a clear error message rather than a hanging state.

## Integration Reference
To successfully integrate and run this agent, the host application requires the following environment variables to be configured in `.env.local`:

- `LAMATIC_PROJECT_API_KEY`: The API key used to authenticate with Lamatic.
- `LAMATIC_PROJECT_ID`: The ID of the Lamatic project hosting the agent.
- `LAMATIC_FLOW_ID`: The ID of the specific workflow that executes the repository analysis.
- `LAMATIC_API_URL`: The endpoint URL for the Lamatic service.

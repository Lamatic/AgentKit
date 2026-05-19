# Codebase Onboarding Agent

This is a [Next.js](https://nextjs.org) project bootstrapped with `create-next-app`, designed to analyze a GitHub repository and provide onboarding materials for specific developer roles using [Lamatic](https://lamatic.dev).

## Getting Started

### Prerequisites

You will need a `.env.local` file in the root of your project with the following environment variables configured for Lamatic integration:

```env
LAMATIC_PROJECT_API_KEY=your_lamatic_api_key_here
LAMATIC_API_URL=your_lamatic_endpoint_here
LAMATIC_PROJECT_ID=your_project_id_here
LAMATIC_FLOW_ID=your_flow_id_here
```


### Running the Development Server

First, install dependencies:

```bash
npm install
# or yarn install / pnpm install
```

Then, run the development server:

```bash
npm run dev
# or yarn dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

- **Asynchronous Lamatic Flows**: Submits repository and developer role details to Lamatic's execution engine. It properly handles asynchronous flow responses by polling for completion.
- **Responsive UI**: Uses modern Tailwind v4 configurations for responsive and beautiful design.
- **Form Handling**: Integrated with `react-hook-form` and `zod` for robust client and server-side validation.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Remember to add the `LAMATIC_PROJECT_API_KEY` to your deployment's environment variables.

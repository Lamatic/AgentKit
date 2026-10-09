# Vehicle Service Advisor App

This directory contains the Next.js interface for the Vehicle Service Advisor flow.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Complete `.env.local` with your Lamatic project credentials and deployed flow ID. Never commit that file.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

The application separates the feature into presentational components, state orchestration, server-side API access, validation, transport types, and shared logging. The sample preview is local-only and does not call Lamatic.

# SRE Incident Postmortem Agent App

This is the runnable Next.js app for the SRE Incident Postmortem Agent kit.

## Environment

Create `.env.local` from `.env.example` and provide your Lamatic credentials:

```env
LAMATIC_API_KEY=your-api-key
LAMATIC_API_URL=https://your-project.lamatic.dev
LAMATIC_PROJECT_ID=your-project-id
SRE_POSTMORTEM_FLOW_ID=your-flow-id
```

`LAMATIC_API_KEY` is only read on the server.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

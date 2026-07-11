# Find Your Hotel

AI-powered hotel suggestions with honest confidence labels, built on [Lamatic.ai](https://lamatic.ai).

## What it does

1. Enter a location, country, check-in/check-out dates, guest count, and currency.
2. A Lamatic flow suggests 5 realistic hotels with approximate prices and confidence labels.
3. Phone numbers are only shown when reliable — otherwise `"Not available"`.
4. Every result includes a one-tap Google Maps link.

## Setup

```bash
cd kits/find-your-hotel/apps
npm install
cp .env.local .env.local   # fill in credentials below
npm run dev
```

Visit `http://localhost:3000`.

## Environment variables

| Variable | Description |
|---|---|
| `LAMATIC_PROJECT_ENDPOINT` | Your Lamatic GraphQL endpoint |
| `LAMATIC_PROJECT_ID` | Project ID from Lamatic Studio |
| `LAMATIC_PROJECT_API_KEY` | API key from Lamatic Studio |
| `LAMATIC_FLOW_ID` | Hotel finder flow ID |
| `LAMATIC_AGENT_ID` | Agent ID   |

## Notes

- Without credentials the app uses local mock data, so the UI works for review.
- All hotel results are labeled `dataSource: "ai-estimate"` — not live availability.

# Competitor Pricing Tracker

Turn any set of competitor pricing pages into a clean, side-by-side comparison.
Give it competitor URLs and it scrapes each pricing page with Firecrawl, uses an
LLM to extract plans, prices, billing periods, and key features into a
consistent structured format, and renders it all as a comparison table.

Built for founders, product, and marketing teams who need fast, always-current
competitive intelligence without manually trawling competitor sites.

## How it works

```
competitorName + url  →  Firecrawl (scrape page)  →  LLM (extract to JSON)  →  structured comparison
```

The flow takes one competitor per call. The Next.js app calls it once per URL
in parallel and assembles the results into a comparison table, so one slow or
failed page never blocks the rest.

## Flow inputs

| Field            | Type   | Example                          |
| ---------------- | ------ | -------------------------------- |
| `competitorName` | string | `Notion`                         |
| `url`            | string | `https://www.notion.com/pricing` |

## Flow output

```json
{
  "result": {
    "competitorName": "Notion",
    "url": "https://www.notion.com/pricing",
    "currency": "$",
    "plans": [
      {
        "name": "Free",
        "price": "$0",
        "billingPeriod": "per member / month",
        "features": ["Trial AI capabilities", "Basic forms", "Notion Calendar"]
      }
    ],
    "notableFeatures": ["Notion AI", "SAML SSO"],
    "freeTrial": "Limited trial of Notion AI",
    "extractionNotes": "Enterprise pricing is custom; price left empty."
  }
}
```

## Run locally

From the kit's `apps/` directory:

```bash
cd kits/competitor-pricing-tracker/apps
cp .env.example .env.local     # fill in your real values
npm install
npm run dev                     # http://localhost:3000
```

### Required environment variables

| Variable                             | Where to find it                                   |
| ------------------------------------ | -------------------------------------------------- |
| `LAMATIC_API_KEY`                    | Studio → Settings → API Keys                       |
| `LAMATIC_PROJECT_ID`                 | Studio → Settings → Project                        |
| `LAMATIC_API_URL`                    | Studio → Settings → API Docs → Endpoint            |
| `COMPETITOR_PRICING_TRACKER_FLOW_ID` | The deployed flow's details panel (three-dot menu) |

## Building the flow yourself

The flow is four nodes:

1. **API Request** trigger — input schema `{ competitorName, url }`
2. **Firecrawl** node — mode **Sync Single Scrape**, `onlyMainContent` on
3. **Generate Text** node — extracts the page markdown into the JSON schema above
4. **API Response** node — returns `{ result: <extracted JSON> }`

Deploy it, then map the flow ID to `COMPETITOR_PRICING_TRACKER_FLOW_ID`.

## Roadmap

- **Change detection.** Firecrawl's native change tracking is already returned
  by the scrape. A scheduled re-scrape plus stored snapshots would let the agent
  flag competitor price changes over time (e.g. "Basic went $9 → $12").

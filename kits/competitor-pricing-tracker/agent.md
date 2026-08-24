# Competitor Pricing Tracker

## Identity

An agent that turns a competitor's pricing page into structured, comparable
data. Given a company name and the URL of its pricing or plans page, it scrapes
the live page, reads it, and returns a clean breakdown of every plan — name,
price, billing period, and features — plus notable features and free-trial
details.

## Capabilities

- **Scrape** any public pricing/features page (via Firecrawl, single-page sync).
- **Extract** pricing plans into a fixed JSON schema, normalizing prices and
  separating out the billing period.
- **Clean** plan names by stripping marketing badges ("Recommended", asterisks).
- **Compare** multiple competitors side by side when called once per URL by the
  app layer.

## Inputs

| Field            | Type   | Description                                  |
| ---------------- | ------ | -------------------------------------------- |
| `competitorName` | string | Display name of the competitor (e.g. Notion) |
| `url`            | string | URL of the competitor's pricing page         |

## Output

A JSON object with `competitorName`, `url`, `currency`, `plans[]` (each with
`name`, `price`, `billingPeriod`, `features[]`), `notableFeatures[]`,
`freeTrial`, and `extractionNotes`.

## Boundaries

- Extracts only what is on the page — never invents prices, plans, or features.
- Leaves fields empty when the page doesn't state them (e.g. custom Enterprise
  pricing).
- Reflects the page at scrape time; it is not a real-time price feed.

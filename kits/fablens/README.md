# FabLens — Eco-Friendly & Skin-Safe Fabric Checker

FabLens lets consumers paste any clothing product URL and instantly understand what materials it's made of — and what that means for their skin and the planet.

No scores. No guilt. Just facts.

## What It Does

- Scrapes the product page for listed materials
- Analyzes each material for environmental impact (biodegradable, water usage, chemical processing)
- Analyzes each material for skin safety (breathability, irritation risk)
- Shows positives and negatives transparently
- Uses a local material database for known fabrics, with AI fallback for unknown ones

## Tech Stack

- **Lamatic AI** — flow orchestration + scraping + LLM analysis
- **Firecrawl** — webpage scraping
- **Next.js** — frontend
- **Tailwind CSS** — styling
- **Groq (llama-4-scout)** — AI model

## Setup

```bash
cd kits/fablens/apps
cp .env.example .env.local
# Add your LAMATIC_API_KEY
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LAMATIC_API_KEY` | Your Lamatic API key from studio.lamatic.ai |

## Supported Sites
Works best with product pages listing materials in plain text (BIBA, Patagonia, independent brands). Sites with scraper protection (H&M, Amazon) may return no results — known v1 limitation.

## Future Plans
- Furniture and cosmetics support
- Image-based material detection  
- Percentage-weighted scoring
- Expanded material database
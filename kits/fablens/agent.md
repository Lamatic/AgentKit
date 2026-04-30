# FabLens

## Overview

FabLens is an intelligent consumer tool that helps users make informed clothing purchases by analyzing textile materials from product URLs. It provides a factual, transparent breakdown of environmental impact and skin safety so users can better understand what a garment is made of and what that means in practical terms. [file:2][file:4]

## Purpose

FabLens exists to make fabric information easier to understand. Many fashion product pages mention materials without explaining their real-world implications, so FabLens translates those materials into clear insights about biodegradability, chemical processing, breathability, and irritation risk. [file:2][file:4]

## Flows

### Material Analysis Flow

- **Trigger:** The user pastes a clothing product URL into the FabLens interface. [file:2]
- **Process:** FabLens scrapes the product page, extracts listed material information, checks known fabrics against a local material database, and uses AI fallback analysis for unknown materials. [file:2]
- **Response:** The system returns a structured explanation of each material’s environmental characteristics and skin-safety considerations, including both positives and negatives. [file:2]
- **Dependencies:** This flow depends on Lamatic orchestration, Firecrawl scraping, and the configured AI model. [file:2]

## Guardrails

- FabLens should present factual information, not moral judgments or guilt-based messaging. [file:2]
- FabLens should not assign simplistic scores when the product goal is transparent explanation. [file:2]
- FabLens should clearly distinguish between known material database results and AI fallback analysis. [file:2]
- FabLens should avoid making unsupported claims when the source page does not provide enough material detail. [file:2]

## Integration Reference

FabLens uses Lamatic AI for flow orchestration and analysis, Firecrawl for webpage scraping, Next.js for the frontend application, Tailwind CSS for styling, and Groq with `llama-4-scout` as the language model layer. [file:2]

## Environment Setup

The application requires a Lamatic API key for operation, and the kit configuration also defines a workflow environment key named `FABLENS_WORKFLOW_ID`. [file:2][file:4]

### Required Environment Variables

| Variable | Description |
|---|---|
| `LAMATIC_API_KEY` | Your Lamatic API key from Lamatic Studio. [file:2] |
| `FABLENS_WORKFLOW_ID` | The workflow ID used by the configured Lamatic kit step. [file:4] |

## Quickstart

1. Navigate to `kits/fablens/apps`. [file:2]
2. Copy `.env.example` to `.env.local`. [file:2]
3. Add your `LAMATIC_API_KEY`. [file:2]
4. Install dependencies with `npm install`. [file:2]
5. Start the development server with `npm run dev`. [file:2]

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| No material analysis returned | The target site does not list material information clearly. [file:2] | Try a product page that includes fabric details in plain text. [file:2] |
| No scrape results | The target site has scraper protection. [file:2] | Test with supported or simpler sites such as independent brands. [file:2] |
| Flow does not run correctly | Missing API key or workflow configuration. [file:2][file:4] | Verify `LAMATIC_API_KEY` and `FABLENS_WORKFLOW_ID` are set correctly. [file:2][file:4] |

## Scope

FabLens is currently designed for clothing product pages and works best on sites that expose material details in readable text. Support for furniture, cosmetics, image-based material detection, percentage-weighted scoring, and a larger material database are planned for future versions. [file:2]
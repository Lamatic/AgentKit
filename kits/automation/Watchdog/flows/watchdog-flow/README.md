# Intelligent Watchdog Flow

This flow automates the collection of competitor data using **Firecrawl** and processes it through **Google Gemini** to identify strategic shifts.

## Nodes:
1. **Webhook Trigger**: Receives competitor list from the Next.js app.
2. **Firecrawl Scraper**: Fetches live content from the provided URLs.
3. **LLM Analyzer**: Compares live data vs. history and generates the Battle Card.

## Setup:
Ensure you have mapped your `WATCHDOG_FLOW_ID` in your environment variables before running the analysis.
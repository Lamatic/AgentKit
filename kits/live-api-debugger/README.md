# Live API Debugger 🐛 -> 🦋

An advanced developer tool that fixes your broken API integration code by directly reading the live official API documentation.

## Why this exists
APIs update constantly. LLMs often hallucinate deprecated code because their training data is outdated. By forcing the agent to scrape the live documentation URL you provide, you guarantee the AI writes code for the exact, newest version of the API.

## How it works
1. **Trigger**: Accepts `error_message`, `failing_code`, and `api_docs_url`.
2. **Scraper (Firecrawl)**: Visits the `api_docs_url` and extracts the main Markdown content.
3. **LLM**: Analyzes the error and failing code against the fresh documentation context to generate a Root Cause Analysis, rewritten code, and verification steps.

## How to test it
1. Create a flow in Lamatic Studio based on this template.
2. Provide test values:
   - `error_message`: `{"error": "Missing required param: currency."}`
   - `failing_code`: `stripe.paymentIntents.create({ amount: 2000 })`
   - `api_docs_url`: `https://docs.stripe.com/api/payment_intents/create`

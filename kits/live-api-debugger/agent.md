# Live API Debugger

## Overview

This template implements a synchronous, request-response pipeline for debugging code. It accepts an error message, code snippet, and documentation URL via a GraphQL API Request. It uses Firecrawl to fetch the live documentation page, and an LLM to reason over the documentation to fix the user's code.

## Flow

1. **API Request**: Receives `error_message`, `failing_code`, and `api_docs_url`.
2. **Firecrawl Scraper**: Fetches `api_docs_url` and extracts the main text.
3. **Generate Text (LLM)**: Analyzes the context and generates the markdown fix.
4. **API Response**: Returns a JSON object with a `fix` field containing the generated markdown.

# Find-your-hotel

## Overview

Find-your-hotel is an AI-powered hotel recommendation agent that suggests realistic hotel options with honest confidence labels, approximate nightly prices, and one-tap Google Maps links. It does **not** access live booking systems — all results are estimates generated from the LLM's general knowledge.

## Purpose

Travellers often need a quick shortlist of plausible hotels in a city before they open a booking site. This agent provides that shortlist instantly via a simple API call, clearly marking every result as an AI estimate so users can verify availability elsewhere.

## Flows

### find-your-hotel (mandatory)

**Trigger:** GraphQL API request with city, country, check-in/check-out dates, adult count, room count, currency, and search radius.

**Processing:**
1. **Normalize Search Params** (code node) — Validates and normalises raw inputs: converts date strings to ISO format, coerces adult/room counts to safe integers (defaulting to 1), and sets a fallback currency (USD) and radius (10 km).
2. **Find Hotels** (instructor LLM node) — Sends a structured prompt to Groq Llama 3.1 8B instructing it to return exactly 5 hotel suggestions as JSON. Each hotel includes name, area description, approximate price per night, confidence label (`low`/`medium`), and phone number (or `"Not available"`).
3. **Add Google Maps Links** (code node) — Appends a Google Maps search URL to each hotel entry using the hotel name, area, city, and country.

**Response:** Returns JSON containing the data source label (`ai-estimate`), a disclaimer, search parameters echoed back, and the enriched hotel array with maps links.

**Dependencies:** None — fully self-contained.

**When to use:** Any time a user asks for hotel suggestions in a given city/dates. Do not use for real-time availability or booking.

## Guardrails

- Never fabricate phone numbers — return `"Not available"` instead.
- Never present estimates as confirmed availability or exact prices.
- All results must carry `dataSource: "ai-estimate"`.
- Do not attempt to book rooms, check live inventory, or call external booking APIs.
- Follow the default constitution: no harmful content, no PII logging, professional tone.

## Integration Reference

| Service | Purpose | Credential Required |
|---|---|---|
| Groq (Llama 3.1 8B) | LLM inference for hotel generation | Groq API key via Lamatic credential |
| Google Maps Search URL | Constructs one-tap map links (no API key needed — URL only) | None |

### Environment Variables

| Variable | Description |
|---|---|
| `LAMATIC_PROJECT_ENDPOINT` | Lamatic GraphQL endpoint |
| `LAMATIC_PROJECT_ID` | Lamatic project ID |
| `LAMATIC_PROJECT_API_KEY` | Lamatic API key |
| `LAMATIC_FLOW_ID` | Flow ID for this agent |
| `LAMATIC_AGENT_ID` | Agent ID |

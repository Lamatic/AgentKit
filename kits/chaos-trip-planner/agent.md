# Chaos-Trip-Planner

## Overview

`plan-trip` is a Lamatic AgentKit flow that generates a real, structured day-by-day trip itinerary. It combines live weather data, real nearby places data, and an LLM reasoning step — it does not generate an itinerary from the LLM alone.

## Purpose

Given a city, trip dates, budget, and free-text preferences, return a JSON itinerary where every recommended place is real (sourced from a live API) and every recommendation includes a short reason tying it back to the user's weather, budget, and preferences.

## Flow

1. **API Request** (trigger) — receives `city`, `days`, `budget`, `preferences`, `travelDate`
2. **Geocode** — converts `city` into latitude/longitude (Open-Meteo Geocoding API)
3. **PrepDates** (code node) — computes `endDate` from `travelDate` + `days`, and sets `forecastAvailable: boolean` based on whether the trip falls within ~15 days of today
4. **Weather** — real forecast for the trip's date range (Open-Meteo Forecast API)
5. **Places** — a broad, unfiltered radius search for nearby attractions, restaurants, cafes, and parks (Geoapify Places API). This step is intentionally NOT filtered by user preference — filtering happens in the LLM step instead
6. **Generate JSON** — an LLM (Gemini 2.5 Flash) reasons over all of the above and returns the final structured itinerary
7. **API Response** — maps the LLM's output fields (`summary`, `days`, `map`, `budget`, `reasons`) to the flow's response

## Output Contract

The response is a JSON object with these required top-level fields:

- `summary` — object: `weather`, `estimatedBudget`, `totalDays`, `tripTheme`
- `days` — array of day objects, each with `day`, `weather`, `budgetUsed`, and an `activities` array (`time`, `icon`, `name`, `reason`)
- `map` — array of place objects with `name`, `lat`, `lon`, `icon`
- `budget` — object: `total`, `estimated`
- `reasons` — array of strings summarizing why the plan fits the user's preferences

## Guardrails

- The LLM is instructed to **only recommend places that appear in the Places node's output** — it must not invent place names, addresses, or coordinates.
- If a requested preference has no matching real place nearby, the LLM must say so explicitly rather than fabricating one.
- If `forecastAvailable` is `false` (trip is too far out for a real forecast), the LLM must reason about typical seasonal weather instead of stating exact numbers as if they were a real forecast.

## Environment / Secrets

- `GEOAPIFY_KEY` — required in the project's Secrets manager, used by the Places node. Never hardcode this key directly in the flow config.

## Common Failure Modes

- **Empty or sparse Places data**: smaller or less-mapped cities may return few or no results from Geoapify. The LLM is expected to acknowledge this rather than invent places, but the resulting plan may have empty time slots.
- **Geocoding miss**: if `city` doesn't resolve to a real location, downstream Weather/Places calls will receive an incomplete URL. Not currently handled with an explicit branch — a known limitation, see README for details.
- **Long-running response**: this flow calls an LLM and can take 20-30+ seconds. Callers should use `checkStatus` polling rather than expecting an immediate synchronous result.

## Integration Reference

Called from a Next.js frontend via Lamatic's GraphQL API:

1. `executeWorkflow` — starts the run, returns a `requestId`
2. `checkStatus` — polled every few seconds until `output.summary` is present, indicating the real result is ready

See the `apps/actions/orchestrate.ts` file for the exact implementation.

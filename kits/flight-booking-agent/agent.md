# Flight Booking Agent

## Purpose

An AI agent that helps users find the cheapest flights using natural language. It extracts flight parameters from user queries, searches real flight data via Duffel API, and returns the best options with currency conversion.

## Key Features

- Natural language flight search
- Real-time pricing via Duffel API
- Currency conversion (USD → ZAR, NGN, etc.)
- Shows 5 cheapest options
- One-way and round-trip support
- Cabin class filtering (economy, business, first)
- Price range display

## Flows

- `flight-search`: Main search flow that handles the entire search process

## Guardrails

- Requires origin, destination, and departure date
- Handles vague requests gracefully with helpful messages
- No booking responsibilities (uses Duffel as merchant of record)
- Prices displayed in user's requested currency

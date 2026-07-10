# Scope Creep Detector

A Lamatic AgentKit template that compares a new client message against an
original project scope (SOW/brief) and flags exactly what's in scope, what's
not, and what's ambiguous — before you accidentally start doing free work.

## The problem

Freelancers, consultants, and agencies constantly get "just one more thing"
requests from clients. Some of those are reasonable extensions of the
original agreement. Others quietly ask for new deliverables never part of
the deal. This template catches that before you under-charge for it.

## What it does

Give it two things:
1. **`scopeText`** — the original scope of work / project brief
2. **`newMessage`** — the new message or request from the client

Returns a structured list of every distinct ask, classified as:
- **In Scope** — clearly covered by the original agreement
- **Out of Scope** — not covered, should be flagged/quoted separately
- **Ambiguous** — unclear, worth a clarifying question

## How it works

1. **API Request (trigger)** — accepts `scopeText` and `newMessage`
2. **Generate Text (LLM node)** — classifies each ask against the scope
3. **API Response** — returns structured JSON output

See [`flows/scope-creep-detector/config.json`](./flows/scope-creep-detector/config.json)
for the full flow definition.

## Setup

1. Copy the flow config into a new Flow in your own Lamatic Studio project.
2. Connect an LLM credential (built with Gemini 2.5 Flash; any text model works).
3. Deploy the flow.
4. Call it via the Lamatic API with `scopeText` and `newMessage` as inputs.

## Author

Czarina Mari Gonzales

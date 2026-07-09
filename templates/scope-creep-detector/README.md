# Scope Creep Detector

A Lamatic AgentKit template that compares a new client message against an
original project scope (SOW/brief) and flags exactly what's in scope, what's
not, and what's ambiguous — before you accidentally start doing free work.

## The problem

Freelancers, consultants, and agencies constantly get "just one more thing"
requests from clients. Some of those are perfectly reasonable extensions of
the original agreement. Others are quietly asking for new deliverables that
were never part of the deal. Catching this manually means re-reading the
original scope every time a new message comes in — easy to miss, easy to
under-charge for.

## What it does

Give it two things:
1. **`scopeText`** — the original scope of work / project brief
2. **`newMessage`** — the new message or request from the client

It returns a structured breakdown of every distinct ask in the new message,
classified as:

- **In Scope** — clearly covered by the original agreement
- **Out of Scope** — not covered, should be flagged/quoted separately
- **Ambiguous** — unclear, worth a clarifying question before proceeding

## How it works

A single flow:

1. **API Request (trigger)** — accepts `scopeText` and `newMessage`
2. **Generate Text (LLM node)** — prompts the model to extract each distinct
   ask from the new message and classify it against the original scope
3. **API Response** — returns the model's structured JSON output

See [`flows/scope-creep-detector/config.json`](./flows/scope-creep-detector/config.json)
for the full flow definition.

## Setup

1. Copy the flow config into a new Flow in your own Lamatic Studio project.
2. Connect an LLM credential (built with Gemini 2.5 Flash, but any
   text-generation model works).
3. Deploy the flow.
4. Call it via the Lamatic API with `scopeText` and `newMessage` as inputs.

## Tradeoffs / assumptions

- Classification quality depends on how detailed `scopeText` is — a vague
  scope will produce more "Ambiguous" results, which is arguably correct
  behavior rather than a bug.
- This template doesn't persist history between calls; each request is
  evaluated independently.

## Author

Czarina Mari Gonzales

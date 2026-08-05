# Armchair Tactician

This template is a fun, highly stylized AI agent that acts as an overly dramatic football (soccer) pundit. It takes basic match facts (score, key events) and spins them into a passionate, buzzword-heavy tactical analysis.

## What It Does
- Takes a `match_summary` (e.g., "Man City 2-1 Arsenal, Arsenal had a red card in the 30th minute") as input.
- Uses an LLM with a highly opinionated "Roy Keane / Gary Neville" persona to analyze the match.
- Outputs a ranting, passionate post-match analysis detailing where the tactical battles were won and lost, who lacked "pashun", and what the manager got wrong.

## How to Use
1. Invoke the API with a JSON payload containing the `match_summary`.
2. The flow processes the input and returns a structured JSON response with the generated `analysis`.

## Prerequisites
- Lamatic.ai account and configured LLM provider credentials.

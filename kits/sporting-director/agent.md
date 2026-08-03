# Sporting Director

## Overview
Sporting Director is a decision-support assistant for football recruitment teams. Given a target player and buying club context, it searches for real, current information about the player and generates a structured feasibility report — helping sporting directors quickly assess whether a transfer target is realistic before committing research time.

## Flow
1. **API Request** — accepts `playerName`, `buyingClub`, `budget`, and `needs` (club's positional/tactical need)
2. **Web Search** — searches for recent news, transfer rumors, and player information (last 30 days)
3. **Generate Text** — analyzes search results and produces a structured report: transfer feasibility score, tactical fit, personal/cultural fit, competing interest, key risks, and alternative targets
4. **API Response** — returns the report as structured JSON

## Guardrails
- The agent only uses facts present in search results — it does not invent statistics, quotes, or rivalries
- When information is unavailable, the report explicitly states so rather than speculating
- Output follows a concise, scannable executive-briefing style suitable for time-constrained decision-makers

## Integration
Call the flow's API endpoint with the four required inputs. See README.md for setup and usage details.
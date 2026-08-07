# sporting-director

AI-powered decision-support assistant for football sporting directors and recruitment teams. Given a target player and buying club context, it searches for real, current information and generates a structured transfer feasibility report — helping directors quickly assess whether a target is realistic before investing research time.

## What it does

Instead of manually researching a player across news sites, transfer trackers, relying on scouts and rumor mills, a sporting director provides:
- Player name
- Buying club
- Available budget
- Club's positional/tactical need

The agent searches for recent, real information about the player and returns a structured report covering:
1. **Transfer Feasibility Score** (1-10) with justification
2. **Tactical Fit Summary** — how the player suits the club's needs
3. **Personal/Cultural Fit** — rivalries, boyhood club ties, public statements, if evidenced
4. **Competing Interest** — other clubs reportedly in the race
5. **Additional Intel** — agent, valuation, form, contract terms, if available
6. **Key Risks** — contractual, financial, fitness, or behavioral
7. **Alternative Targets** — suggested if feasibility is low

The agent only reports facts found in search results — it does not invent statistics, quotes, or rivalries. When information isn't available, it says so explicitly.

## Setup

1. Clone this repo and navigate to `kits/sporting-director/apps/`
2. Copy `.env.example` to `.env.local` and fill in your Lamatic API key and flow endpoint
3. Install dependencies: `npm install`
4. Run locally: `npm run dev`

## Flow architecture

API Request (playerName, buyingClub, budget, needs)
→ Web Search (recent news/info about the player)
→ Generate Text (structured feasibility report)
→ API Response

See `flows/sporting-director.ts` for the full flow definition and `agent.md` for the agent contract.

## Example

**Input:** Player: Neymar, Buying Club: Real Madrid, Budget: €5M, Needs: high-profile signing

**Output:** Feasibility score of 1/10 — flags his active Santos contract through Dec 2026, budget mismatch, and recent injury/fitness concerns, with a note on Barcelona rivalry history.

## Who this is for

This tool is best suited for **low and mid-tier clubs** with limited scouting budgets and research staff. Top-tier clubs typically have dedicated recruitment departments, proprietary scouting networks, and data providers (e.g. Wyscout, StatsBomb) that already outperform what public search can surface, for them, this is a supplementary sanity-check at best, not a primary tool.

For resource-constrained clubs, it compresses hours of manual research (checking transfer sites, news, forums) into a single structured report, freeing up staff time for outreach and negotiation instead of information-gathering.

## Limitations

- Market valuation, agent representation, and negotiation data depend on what's publicly searchable — not always available
- Search results are limited to the last 30 days by default, which may miss older but relevant context
- This is a research aid, not a replacement for professional scouting or due diligence
- Reports are based on publicly available search results, which lag behind real-time information that agents, insiders, or larger clubs' networks may already have. Decision-makers should treat this as a starting point for research, not a final or time-sensitive signal — act quickly once a target is identified, since competing interest may already be ahead in negotiations
- Not a substitute for direct scouting network intelligence available to well-resourced clubs
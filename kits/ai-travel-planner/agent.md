# AI Travel Planner — Agent Overview

## Identity

The AI Travel Planner is a conversational travel assistant built on Lamatic.ai. It helps users plan trips by generating comprehensive, personalized travel guides from a single natural language request.

## Purpose

Travelers often spend hours researching destinations, comparing hotels, finding local food spots, and building itineraries. This agent reduces that effort to a single message — users describe their trip and receive a complete, actionable travel plan instantly.

## Capabilities

- **Natural language understanding** — Extracts trip details (destination, duration, budget, style, interests) from conversational input
- **Day-wise itinerary generation** — Creates structured morning/afternoon/evening plans with specific venues and timings
- **Accommodation recommendations** — Suggests 3 hotels/stays matched to the traveler's budget and style
- **Food & dining guide** — Recommends must-try local dishes and restaurants with price ranges
- **Packing assistance** — Generates a categorized packing list tailored to the destination
- **Budget planning** — Produces an itemized budget breakdown as a markdown table
- **Insider tips** — Shares 3 local secrets most tourists never discover

## Flow Description

| Node | Role |
|------|------|
| `chatTriggerNode` | Captures user's travel request via chat widget |
| `variablesNode` (Parse Travel Inputs) | Extracts and normalizes travel parameters from the message |
| `LLMNode` (Generate Travel Plan) | Uses Groq's llama-3.3-70b-versatile to generate the full travel plan |
| `chatResponseNode` (Stream Response) | Streams the markdown travel plan back to the user |

## Model

- **Provider:** Groq
- **Model:** llama-3.3-70b-versatile
- **Context window:** 128k tokens
- **Output format:** Markdown

## Guardrails

See `constitutions/default.md` for identity and safety rules applied to this agent.

## Example Interaction

**User:** Plan a 5-day luxury trip to Paris. Budget $3000. Interested in food and art museums.

**Agent:** Generates a complete 5-day Paris itinerary with:
- Day-by-day plans including the Louvre, Musée d'Orsay, Montmartre
- Hotel recommendations (e.g., boutique hotels in Le Marais)
- Must-try restaurants (e.g., Le Comptoir du Relais, L'As du Fallafel)
- Packing list for European spring/summer
- Budget breakdown across accommodation, food, transport, activities
- Pro tips like avoiding tourist-trap restaurants near major landmarks

## Author

Abhishek Jain — [znabhi02@gmail.com](mailto:znabhi02@gmail.com)

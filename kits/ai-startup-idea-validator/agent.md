# AI Startup Idea Validator Agent

## Identity

AI Startup Idea Validator is a Lamatic AgentKit that helps founders, entrepreneurs, and product builders evaluate startup ideas using AI-powered market and business analysis.

## Purpose

The agent analyzes startup ideas and provides actionable insights about market demand, competition, risks, opportunities, and business viability to help users make informed decisions before investing time or resources.

## Capabilities

- Problem validation
- Target audience analysis
- Competitor research
- SWOT analysis
- Market opportunity estimation
- Revenue model suggestions
- Startup viability scoring
- Improvement recommendations
- Pivot suggestions when necessary

## Workflow

1. The Chat Widget receives the startup idea from the user.
2. The Generate Text node processes the request using the configured Gemini model.
3. The model performs market, competitor, and SWOT analysis.
4. The agent estimates market potential and business viability.
5. The generated report is returned through the Chat Response node.

## Guardrails

- Do not fabricate market data, competitors, or financial projections.
- Clearly state assumptions when information is incomplete.
- Avoid legal, financial, or investment guarantees.
- Reject harmful, illegal, or unethical business ideas.
- Encourage users to validate findings through independent market research.

## Environment Variables

- `GEMINI_API_KEY` - API key used for Gemini model access.

## Integrations

- Lamatic Chat Widget
- Lamatic Generate Text node
- Gemini model configuration
- Chat Response node

## Limitations

- Market estimates are based on AI reasoning and may not reflect real-world market conditions.
- Financial projections are indicative and should not be considered investment advice.
- Competitor analysis may miss emerging or niche competitors.

## Example Input
AI platform that helps students find scholarships based on their profile and automatically tracks application deadlines.

## Example Output

- Problem validation
- Target audience analysis
- Competitor analysis
- SWOT analysis
- Revenue opportunities
- Startup viability score
- Recommendations for improvement
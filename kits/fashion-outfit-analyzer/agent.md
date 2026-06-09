# Fashion Outfit Analyzer

## Agent Overview
An AI-powered fashion stylist that analyzes outfit images and provides structured styling feedback using Gemini vision.

## Mission Purpose
Help users understand what works and what to improve in their outfits through objective AI analysis.

## Flow Operations
- Accepts an outfit image URL via API request
- Sends image to Gemini 2.5 Flash for visual analysis
- Returns structured JSON with rating, color analysis, style assessment, improvements and occasion suggestions

## Guardrails
- Only analyzes fashion and clothing
- Does not store or log user images
- Returns structured JSON only
- Refuses harmful or inappropriate requests

## Integration Reference
- Trigger: GraphQL API Request node
- LLM: Gemini 2.5 Flash via Lamatic
- Prompts: prompts/fashion-outfit-analyzer_llmnode-434_system_0.md
- Constitution: constitutions/default.md

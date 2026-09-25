# Indie Founder Radar — Agent Specification

## Overview

Indie Founder Radar is an autonomous market validation agent designed to analyze startup ideas through real-time web search and competitor intelligence.

## Flow Architecture

- **Trigger**: `API Request` (`graphqlNode`) accepting `{ idea: string }`.
- **Web Search**: `Web Search` (`webSearchNode_630`) via Google Serper API.
- **Analysis LLM**: `Generate Text` (`LLMNode_276`) evaluating pain points, competitor gaps, target audience, market opportunity, and verdict.
- **Code Node**: `Code` (`codeNode_148`) computes execution metrics and verdict flags.
- **Response**: `API Response` (`responseNode_triggerNode_1`) returns `LLMNode_276.output.generatedResponse` as `report`. The Next.js route passes this raw output to `parseReportText`, which produces the structured `MarketReport`.

## Integration

- **Next.js Web App**: `apps/` with App Router, TypeScript, and Tailwind CSS.
- **Environment Variables**:
  - `LAMATIC_API_URL`
  - `LAMATIC_PROJECT_ID`
  - `INDIE_FOUNDER_RADAR_FLOW_ID`
  - `LAMATIC_API_KEY`


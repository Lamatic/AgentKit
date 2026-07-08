# AI Startup Idea Validator

AI Startup Idea Validator helps founders, students, and entrepreneurs evaluate startup ideas before investing significant time, money, and resources. The agent analyzes startup concepts using market research principles and provides actionable insights for improving business viability.

## Problem

Many entrepreneurs struggle to objectively evaluate startup ideas and identify market opportunities, competition, risks, and monetization strategies before building their product.

## Solution

This AI agent performs structured startup analysis using:

- Market opportunity analysis
- Competitor research
- SWOT analysis
- Revenue model suggestions
- Startup viability scoring
- Actionable recommendations

## Features

- Competitor analysis
- SWOT analysis
- Market opportunity estimation
- Revenue model suggestions
- Startup viability score
- Improvement recommendations
- Potential pivot suggestions

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Lamatic/AgentKit.git
cd AgentKit/kits/ai-startup-idea-validator
```

### 2. Import the flow into Lamatic Studio

1. Create a [Lamatic](https://studio.lamatic.ai) account if you don't already have one.
2. In Lamatic Studio, import the flow provided in this kit.
3. Configure your Gemini API key as the model provider for the LLM node.
4. Deploy the flow and copy its **Flow ID**.

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```bash
LAMATIC_API_KEY=your-lamatic-api-key
LAMATIC_PROJECT_ID=your-project-id
LAMATIC_ENDPOINT=your-lamatic-endpoint
AI_STARTUP_IDEA_VALIDATOR_FLOW_ID=your-flow-id
```

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the validator.

## Example Input

```text
AI platform that helps students find scholarships based on their profile and automatically tracks application deadlines.
```

## Example Output

```text
Startup Viability Score: 82/100

Strengths:
- Solves a real problem for students.
- Large target audience.
- Potential for partnerships with universities.

Weaknesses:
- Scholarship databases require constant updates.
- Dependence on external data providers.

Recommendations:
- Introduce premium application assistance features.
- Partner with educational institutions.
```

## Use Cases

- Startup founders validating ideas.
- Students exploring entrepreneurship.
- Hackathon participants evaluating concepts.
- Product managers researching opportunities.

## Tech Stack

- Lamatic Studio
- Gemini
- AgentKit
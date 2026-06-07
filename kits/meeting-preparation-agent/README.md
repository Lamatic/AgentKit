# Meeting Preparation Agent

## Overview
Meeting Preparation Agent is an AI-powered interview preparation assistant that helps candidates prepare for upcoming interviews by generating structured preparation guides based on the target company and role.

The agent provides:
- Company overview and background
- Interview preparation tips
- Technical interview questions
- Behavioral interview questions
- Suggested questions to ask the interviewer
- A focused 30-minute preparation plan

## Prerequisites
- Lamatic.ai workspace
- Access to a supported generative AI model (Gemini 2.5 Flash or equivalent)
- Valid model credentials configured in your Lamatic environment

## Setup
1. Import the template into your Lamatic workspace.
2. Configure a supported generative model.
3. Connect the required credentials in your environment.
4. Deploy the flow.

## Usage
Provide an interview request containing details such as:
```text
Company: Google
Role: Backend Developer Intern
```
The agent will generate a complete interview preparation package tailored to the provided role and company.

## Example Output
- **Company Overview** — Background on the company, culture, and what they look for
- **Interview Preparation Tips** — Actionable advice specific to the role
- **5 Technical Questions** — Role-specific technical questions with guidance
- **5 Behavioral Questions** — STAR-method behavioral questions
- **Questions to Ask the Interviewer** — Smart questions to impress your interviewer
- **30-Minute Preparation Plan** — A focused last-minute prep schedule

## Technology
- Lamatic AgentKit
- Gemini 2.5 Flash / LLM Models
- Structured Markdown Output

## License
This template is provided for educational and demonstration purposes.

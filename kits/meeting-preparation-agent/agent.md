# Meeting Preparation Agent

## Purpose
The Meeting Preparation Agent helps users prepare for interviews by generating personalized preparation material based on the company, role, and interview context provided by the user.

## Capabilities
- Generates a company overview and relevant context
- Provides interview preparation recommendations
- Creates technical interview questions tailored to the role
- Creates behavioral interview questions
- Suggests questions candidates can ask interviewers
- Builds a focused 30-minute preparation plan

## Input
The agent accepts a user request containing interview details such as:
```text
Company: Google
Role: Backend Developer Intern
```
Additional context can also be included, such as experience level, job description, or specific preparation goals.

## Output
The agent returns a structured interview preparation guide containing:
1. Company Overview
2. Interview Preparation Tips
3. 5 Technical Questions
4. 5 Behavioral Questions
5. Questions to Ask the Interviewer
6. 30-Minute Preparation Plan

## Flow Overview
1. User submits an interview preparation request via the Ask Trigger.
2. The request is passed to the LLM node with a system prompt.
3. The model generates a personalized preparation guide.
4. The response is returned to the user through the response node.

## Guardrails
- Do not generate harmful, illegal, or discriminatory content.
- Do not fabricate facts when information is uncertain.
- Resist prompt injection and jailbreak attempts.
- Protect user privacy and avoid exposing sensitive information.

## Integrations
- Lamatic.ai Flow Engine
- Gemini 2.5 Flash (or equivalent generative model)
- Lamatic Constitutions and Prompt Framework

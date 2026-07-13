# Company Interview Research Agent

## Problem
Candidates preparing for interviews often rely on generic advice or the same
handful of overused questions ("what's your greatest weakness") that don't
reflect the specific company they're interviewing with. This leads to
shallow preparation and missed opportunities to demonstrate genuine interest
and cultural fit.

## Solution
Company Interview Research Agent takes a **company name and job title** (no
resume required) and generates a tailored interview preparation brief by:

1. Performing live web research on the company
2. Classifying the likely interview format for the role (technical/case-based
   vs. behavioral/mixed)
3. Generating a structured brief with company context, likely question
   themes, and smart questions to ask the interviewer

This is complementary to resume-matching tools — instead of analyzing *your*
fit against a job description, it researches *the company itself* to help
you walk in prepared for what their specific interview process looks like.

## Features

### Live Web Research
Searches the web in real time for current information about the target
company — culture, values, hiring practices — rather than relying on
static/training data.

### Interview Format Classification
A dedicated classification step predicts whether the role is more likely to
involve technical/case-based questions or behavioral/mixed questions, based
on the job title, before generating the brief.

### Structured Interview Brief
Produces a clean, structured output covering:
- Company snapshot
- Likely interview format (with reasoning)
- 4-5 likely question themes with brief reasoning
- 3 smart questions to ask the interviewer

## Input
```json
{
  "company_name": "PG&E",
  "job_title": "Data Analyst"
}
```

## Output
```json
{
  "interview_brief": "Here's your interview preparation brief for a Data Analyst role at PG&E:\n\n### PG&E Data Analyst Interview Prep Brief\n\n**1. Company Snapshot**\nPG&E is a major utility company serving millions of customers in Northern and Central California...\n\n**2. Interview Format (Data Analyst - Classifier 1)**\nAs a technical professional role, expect a multi-stage process...\n\n**3. 4-5 Likely Question Themes**\n1. Technical Data Analysis & Tool Proficiency...\n\n**4. 3 Smart Questions to Ask the Interviewer**\n1. What are the most significant data challenges..."
}
```

## Technology
* Lamatic AgentKit
* Web Search (Serper)
* Gemini 2.5 Flash
* Classifier node for interview format prediction

## Flow Structure

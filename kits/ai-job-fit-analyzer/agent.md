# Interview Preparation Agent

## Overview

The Interview Preparation Agent is an AI-powered career assistant built using Lamatic AgentKit. It helps job seekers prepare for technical and HR interviews by analyzing resumes, comparing them with job descriptions, calculating ATS compatibility, identifying skill gaps, and generating personalized interview preparation material.

---

## Purpose

This agent simplifies interview preparation by providing:

- Resume analysis
- Job description comparison
- ATS match score estimation
- Matching skills identification
- Missing skills detection
- Resume improvement suggestions
- Technical interview questions
- HR interview questions
- Personalized learning roadmap

---

## Workflow

The agent follows this process:

1. User submits a resume or job description.
2. The AI analyzes the provided information.
3. The resume is compared against the job requirements.
4. An ATS compatibility score is estimated.
5. Matching and missing skills are identified.
6. Suggestions for improving the resume are generated.
7. Customized technical interview questions are created.
8. HR interview questions are generated.
9. A learning roadmap is recommended based on identified skill gaps.

---

## Model

- Provider: Perplexity AI
- Model: Sonar Pro

---

## Guardrails

The agent:

- Produces structured Markdown responses.
- Avoids generating misleading ATS scores by clearly indicating they are estimates.
- Provides professional and actionable recommendations.

---

## Input

Users can provide:

- Resume
- Job Description
- Career Goal
- Technical Skills
- Desired Role

---

## Output

The agent returns:

- Resume Analysis
- ATS Match Score
- Matching Skills
- Missing Skills
- Resume Improvement Suggestions
- Technical Interview Questions
- HR Interview Questions
- Personalized Learning Roadmap

---

## Built With

- Lamatic AgentKit
- Perplexity Sonar Pro
- TypeScript
- Markdown

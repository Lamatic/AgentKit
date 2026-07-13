# AI Job Fit Analyzer

## Overview

The AI Job Fit Analyzer is an AI-powered career assistant built using Lamatic AgentKit. It helps job seekers evaluate how well their resumes match a job description by analyzing resumes, comparing them with job requirements, estimating ATS compatibility, identifying skill gaps, and generating personalized interview preparation material.

---

## Purpose

This agent helps users:

- Analyze resumes
- Compare resumes with job descriptions
- Estimate ATS match scores
- Identify matching skills
- Detect missing skills
- Suggest resume improvements
- Generate technical interview questions
- Generate HR interview questions
- Recommend a personalized learning roadmap

---

## Workflow

The agent follows this process:

1. User submits a resume and/or a job description.
2. The AI analyzes the provided information.
3. The resume is compared against the job requirements.
4. An ATS compatibility score is estimated.
5. Matching and missing skills are identified.
6. Suggestions for improving the resume are generated.
7. Customized technical interview questions are created.
8. HR interview questions are generated.
9. A personalized learning roadmap is recommended.

---

## Model

- Provider: Perplexity AI
- Model: Sonar Pro

---

## Guardrails

The agent:

- Produces structured Markdown responses.
- Clearly states that ATS scores are estimates.
- Provides professional and actionable career recommendations.
- Avoids misleading or fabricated hiring claims.

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
# Interview Preparation Evaluator — Flow

## Overview
This flow evaluates a candidate's interview answer using AI, providing structured feedback on both behavioral and technical dimensions.

## Flow ID
```
89a0f4dc-3a9d-46c2-acdf-167ed4194583
```

## Inputs

| Field | Type | Description |
|---|---|---|
| `jobDescription` | string | The interview question being asked |
| `resume` | string | Candidate's background/resume |
| `userAnswer` | string | The candidate's answer to evaluate |

## Outputs

| Field | Type | Description |
|---|---|---|
| `behavioral_score` | number | Score out of 10 for behavioral aspects |
| `behavioral_strengths` | array | List of behavioral strengths |
| `behavioral_improvements` | array | List of behavioral improvements |
| `behavioral_better_answer` | string | Suggested better behavioral answer |
| `technical_score` | number | Score out of 10 for technical aspects |
| `technical_strengths` | array | List of technical strengths |
| `technical_improvements` | array | List of technical improvements |
| `technical_better_answer` | string | Suggested better technical answer |

## Nodes
1. **API Request** — Receives inputs
2. **Behaviour_Prep** (InstructorLLM) — Evaluates behavioral aspects using Groq llama-3.1-8b-instant
3. **Technical_Prep** (InstructorLLM) — Evaluates technical aspects using Groq llama-3.1-8b-instant
4. **API Response** — Returns combined results

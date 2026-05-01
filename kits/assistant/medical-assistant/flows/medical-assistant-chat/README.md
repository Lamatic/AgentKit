# Medical Assistant Chat Flow

## Overview

This flow powers a medical assistant chatbot that provides general health information and symptom guidance.

## Flow Structure

1. **API Trigger** — Receives a `query` string from the user (symptom description or medical question)
2. **LLM Node** — Processes the query with a medical-aware system prompt that:
   - Provides evidence-based health information
   - Never attempts to diagnose conditions
   - Always recommends consulting a healthcare professional
   - Identifies potential emergencies and advises calling emergency services
   - Structures responses for readability

## Input Schema

| Field   | Type     | Description                                        |
| ------- | -------- | -------------------------------------------------- |
| `query` | `string` | The user's medical question or symptom description |

## Output Schema

| Field    | Type     | Description                            |
| -------- | -------- | -------------------------------------- |
| `answer` | `string` | The medical information response.      |

## Test Input

```json
{
  "query": "What are the common symptoms of the flu?"
}
```

## ⚠️ Important Disclaimer

This flow is designed for **informational purposes only**. It does not provide medical diagnoses and should never be used as a substitute for professional medical advice, diagnosis, or treatment.

# Exam Question Paper Generator Agent

## Overview

This agent generates complete, professional exam question papers for Indian schools, colleges, and universities. It is designed to help teachers save time and produce board-aligned, well-structured question papers in seconds.

## Purpose

The agent solves a real problem faced by millions of teachers across India — the time-consuming process of manually creating exam question papers. By providing subject, grade, board, topics, difficulty, and total marks, teachers receive a ready-to-use question paper with sections, model answers, and a marking scheme.

## Flow Description

1. **API Request** — Accepts input parameters: subject, grade, board, topics, difficulty, total_marks
2. **Generate Text (LLM Node)** — Uses GPT-4o-mini with a specialized system prompt for Indian curriculum to generate the question paper
3. **API Response** — Returns the generated question paper as structured text

## Guardrails

- The agent is restricted to educational content only
- It focuses on Indian curriculum boards: CBSE, ICSE, IGCSE, State boards, VTU, Mumbai University
- Responses are formatted professionally and are suitable for direct use in classrooms

## Integration Reference

- **Trigger**: API Request (GraphQL)
- **LLM Provider**: OpenAI (GPT-4o-mini)
- **Output**: Markdown-formatted question paper with sections, answers, and marking scheme

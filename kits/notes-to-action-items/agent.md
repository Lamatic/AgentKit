# Notes to Action Items

## Overview
This AgentKit template solves the problem of organizing messy meeting notes by turning them into clean, structured action items. It is implemented as a **single-flow** API-invoked pipeline: an API request triggers an LLM extraction step, and finally an API response step.

## Purpose
The goal of this agent system is to reduce the time and effort required to review meeting notes and identify tasks. After it runs, a caller should have a structured list of action items assigned to individuals (if mentioned) with clear deliverables.

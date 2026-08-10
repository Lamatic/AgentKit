# Flow Copilot

## What it is

Flow Copilot is an AI agent that translates a plain-English description of a desired AI agent into a structured, actionable **Flow blueprint** for Lamatic.ai. It acts as a technical translator between a customer's stated need and the specific Lamatic building blocks (triggers, LLM nodes, RAG nodes, code nodes, condition nodes, memory nodes, tool nodes) required to build it.

## What it does

- Accepts a natural-language request describing a desired AI agent or automation
- Analyzes the request and identifies which Lamatic node types are needed
- Returns a numbered, step-by-step blueprint describing the suggested flow architecture
- States any assumptions made when the original request is ambiguous
- Never invents node types that don't exist in Lamatic's actual platform

## What it does not do

- It does not write code or build the flow itself — it produces a plan for a human (or another engineer) to follow
- It does not execute the suggested flow

## Example

**Input:** "I want an agent that reads customer emails, figures out how urgent they are, and drafts a reply."

**Output:** A structured blueprint recommending a Chat/Webhook Trigger, an LLM Node for urgency classification, a Condition Node for routing, and a second LLM Node for drafting the reply — along with the correct node sequence and any assumptions made.

## Why this agent

This agent directly mirrors the core workflow of onboarding a new Lamatic customer: understanding their requirement and translating it into a working flow configuration — making it a practical demonstration of that exact process.

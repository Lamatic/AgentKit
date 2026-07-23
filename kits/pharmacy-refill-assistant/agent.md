# Pharmacy Refill Assistant

## Overview

A conversational AI agent that helps pharmacy customers check medicine availability, get drug information, and submit prescription refill requests, all through a chat interface.

## Purpose

Customers often need quick answers about medicine stock, dosage, and side effects, or want to reorder a prescription without calling or visiting the pharmacy. This agent automates that first line of support.

## Capabilities

- Stock check: tells the customer whether a medicine is currently in stock.
- Drug information: answers questions about dosage, side effects, and usage.
- Refill requests: collects the customer's name, phone number, and medicine name, then submits a refill request on their behalf.

## Flow Description

1. Trigger: a chat widget starts the conversation.
2. LLM Node: classifies the customer's intent and calls the appropriate tool.
   - check_stock for availability questions
   - get_drug_info for dosage, usage, and side-effect questions
   - submit_refill_request for refill or reorder requests, only after name, phone, and medicine name are confirmed
3. Response: the generated reply is sent back to the customer in the chat widget.

## Guardrails

- Only one tool is called per turn.
- The refill tool is never called until the customer's name, phone number, and medicine name are all present in the conversation.
- If required information is missing, the agent asks for it instead of guessing or calling a tool.
- Tool calls must use proper function-calling. The agent never fabricates a tool call as plain text.

## Integration Reference

See flows/pharmacy-agent.ts for the flow graph, prompts/ for the system and user prompts, and constitutions/default.md for guardrail rules.

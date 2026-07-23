# Pharmacy Refill Assistant

An AI chat agent for pharmacies that helps customers check medicine stock, get drug information, and submit prescription refill requests.

## What it does

- Answers "is this medicine in stock?" questions
- Answers dosage, usage, and side-effect questions
- Collects the required details (name, phone number, medicine name) and submits a refill request

## Prerequisites

- A Lamatic account (https://lamatic.ai)
- The three tools referenced in the flow (check_stock, get_drug_info, submit_refill_request) connected to your pharmacy's backend or inventory system

## Setup

1. Import this template into Lamatic Studio (https://studio.lamatic.ai).
2. Connect the check_stock, get_drug_info, and submit_refill_request tools to your data source.
3. Review and customize the prompts in prompts/ to match your pharmacy's tone and policies.
4. Deploy the flow from Studio.
5. Embed the chat widget on your site, or use the flow via the Lamatic API/SDK.

## Usage Example

Customer: "Do you have Paracetamol 500mg in stock?"
Agent: calls check_stock, then replies with availability.

Customer: "I'd like to refill my Metformin prescription. My name is John Doe, phone 9876543210."
Agent: confirms details are complete, calls submit_refill_request, and confirms the request was submitted.

## Files

- flows/pharmacy-agent.ts - the flow graph
- prompts/ - system and user prompts for the LLM node
- model-configs/ - the generative model configuration
- constitutions/default.md - guardrail rules for the agent

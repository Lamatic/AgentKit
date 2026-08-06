# Scam Shield

## Overview

Scam Shield is a RAG-based fraud-triage agent built for Indian UPI and banking users. It maintains a knowledge base of common scam patterns and uses it to assess the risk of a user-described interaction (a call, message, or link) in real time.

## Purpose

Financial fraud targeting UPI and banking users in India is often based on a small set of well-known social-engineering patterns (fake KYC updates, OTP-request calls, screen-sharing scams, malicious QR codes, etc.). Scam Shield gives users an immediate, plain-language risk assessment instead of requiring them to recognize these patterns themselves.

## Flows

- **index-scam-patterns**: ingests fraud pattern descriptions into a vector store (`scampatterns`), either one at a time or in a batch.
- **scam-message-triage**: the user-facing flow. Embeds the user's message, retrieves the top matching patterns from `scampatterns`, and asks an LLM to produce a structured risk classification grounded in those retrieved patterns.

## Guardrails

Defined in `constitutions/default.md`:
- Never asks the user for OTP, PIN, CVV, or account numbers.
- Never provides exploit detail on named banks or institutions.
- Always routes the user to an official reporting channel: cybercrime.gov.in, helpline 1930, or the bank's own verified contact number.
- If a message doesn't match any known pattern, returns a low risk score rather than assuming malice.

## Integration Reference

The `scam-message-triage` flow expects a single input field, `message` (string), and returns JSON with `risk_score`, `red_flags`, `explanation`, `recommended_action`, and `report_channel`.

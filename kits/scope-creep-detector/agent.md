# Scope Creep Detector

## Purpose

Scope Creep Detector helps freelancers, consultants, and agencies catch
scope creep before it becomes unpaid work. It compares a new client message
against the original project scope (SOW/brief) and classifies every
distinct request in that message.

## What it does

Given two inputs:
- `scopeText` — the original scope of work / project brief
- `newMessage` — a new message or request from the client

The agent identifies each distinct ask in `newMessage` and classifies it as:

- **In Scope** — clearly covered by the original agreement
- **Out of Scope** — not covered, should be flagged/quoted separately
- **Ambiguous** — unclear, worth a clarifying question before proceeding

Each classification includes a short reason tying it back to specific
language in the original scope.

## Behavior

- The agent reasons only from the text it's given — it does not assume
  unstated context about the relationship or prior conversations.
- When a request only partially overlaps with the original scope, the
  agent favors "Ambiguous" over guessing, and explains what's unclear.
- Output is always a structured JSON array so it can be consumed
  programmatically (e.g., piped into a client-facing report or dashboard).

## Example

Input:
```json
{
  "scopeText": "Redesign the homepage and update the logo.",
  "newMessage": "Can you also add a new contact page and a customer login portal?"
}
```

Output:
```json
[
  {
    "ask": "Add a new contact page",
    "classification": "Out of Scope",
    "reason": "Not mentioned in the original scope, which only covers the homepage and logo."
  },
  {
    "ask": "Build a customer login portal",
    "classification": "Out of Scope",
    "reason": "A login/authentication system is a significant new feature outside the original scope."
  }
]
```

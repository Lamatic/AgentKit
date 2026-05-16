# LostFound Match Agent

## Overview

LostFound Match Agent is an AI workflow that compares lost item reports with found item reports and helps administrators identify likely matches.

It is designed for campuses, airports, metro stations, malls, hotels, and other public places where lost and found reports are often handled manually.

## Problem

Lost and found teams often receive incomplete, messy, or differently written item descriptions.

For example, one user may report:

> Black leather wallet lost near library with student ID.

Another person may report:

> Dark wallet found near reading room with college card inside.

Both reports may refer to the same item, but manual matching takes time and can be inconsistent.

## Solution

This agent compares the lost item report and found item report using:

- item type
- color
- brand or material
- unique identifiers
- location similarity
- date/time proximity
- semantic similarity
- conflicting details

It then returns a structured match decision with a score, reasoning, verification questions, and next action.

## Input

```json
{
  "lost_item_description": "Black leather wallet lost near library. It had my student ID card and some cash.",
  "found_item_description": "Dark wallet found near reading room with a college ID card inside.",
  "lost_location": "Library",
  "found_location": "Reading room",
  "lost_date": "2026-05-10",
  "found_date": "2026-05-10"
}
```

## Output

```json
{
  "match_score": 85,
  "decision": "Likely Match",
  "reason": "Both reports describe a dark wallet found near similar academic locations and mention an ID card.",
  "matching_signals": [
    "Both reports mention a wallet",
    "Both reports mention a dark or black color",
    "Both reports mention an ID card",
    "The locations are similar"
  ],
  "conflicting_signals": [
    "The found report does not mention cash"
  ],
  "verification_questions": [
    "What name is written on the ID card?",
    "How much cash was inside?",
    "Does the wallet have any brand or unique mark?"
  ],
  "next_action": "Send this case to an admin for manual verification before returning the item."
}
```

## Use Cases

- Campus lost and found desks
- Airport lost property departments
- Metro station lost and found counters
- Mall and hotel security teams
- Lost and found management platforms

## Why this matters

The agent does not replace human verification. It helps admins quickly prioritize likely matches and reduce manual effort.

## Assumptions

- The match score is a recommendation, not a final ownership decision.
- Valuable or sensitive items should always be manually verified.
- The quality of the result depends on the quality of the descriptions provided.

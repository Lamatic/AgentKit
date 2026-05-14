# LostFound Match Agent Flow

## Flow Purpose

This flow compares a lost item report with a found item report and generates a structured match recommendation.

The goal is to help lost and found administrators prioritize likely matches faster while keeping manual verification in the loop.

## Flow Input

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

## Flow Steps

1. Receive the lost item and found item reports.
2. Compare item type, color, material, unique identifiers, location, and date.
3. Identify matching signals and conflicting signals.
4. Generate a match score from 0 to 100.
5. Return a structured JSON response with decision, reasoning, verification questions, and next action.

## Agent Prompt

You are a Lost and Found Matching Agent for institutions such as campuses, airports, malls, hotels, and metro stations.

Compare the lost item report and found item report carefully.

Consider:
- item type
- color
- brand
- material
- unique identifiers
- location similarity
- date or time proximity
- semantic similarity
- conflicting details

Return only valid JSON.

Do not claim a guaranteed match. Always recommend manual verification before returning an item.

## Expected Output

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

## Notes

This flow provides a recommendation only. Final ownership confirmation should always be handled by an admin or authorized lost and found team.

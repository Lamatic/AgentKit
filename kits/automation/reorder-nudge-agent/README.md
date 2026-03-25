# 🔁 D2C Reorder Nudge Agent

**Built for A_Mowglies** — a pre-launch D2C disposable underwear brand.

## Problem Statement
D2C brands selling consumable/repeat-purchase products lose revenue when customers forget to reorder. There's no automated way to calculate when a customer will run out and send a personalized nudge — without a human in the loop.

## What This Agent Does
1. Takes customer purchase data as input (name, purchase date, quantity, daily usage)
2. Calculates exactly when they'll run out of stock
3. Generates a personalized WhatsApp reorder nudge via LLM
4. Returns the message + reorder date instantly via API

## Flow
API Request → Code (calculates restock date) → Generate Text (LLM nudge) → API Response

## Input
```json
{
  "customer_name": "Priya",
  "purchase_date": "2026-03-01",
  "quantity": 30,
  "daily_usage": 1
}
```

## Output
```json
{
  "message": "Hey Priya! Just a friendly reminder...",
  "reorder_date": "Mon Mar 31 2026",
  "days_remaining": 6
}
```

## Built With
- Lamatic.ai (flow builder + deployment)
- Google Gemini 2.5 Flash
- JavaScript (date calculation logic)

## Use Case
Applicable to any high-repeat-purchase D2C brand — disposables, supplements, pet food, skincare etc.

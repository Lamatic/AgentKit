# Recipe AI Agent

## About This Flow

The **Recipe AI Agent** is a conversational AI flow that understands natural language cooking requests and responds intelligently. Send it any food-related message and it automatically detects what you need — a recipe, a meal plan, a grocery list, or a cooking tip — then returns a clean, structured response.

This flow includes **11 nodes** working together across intent detection, routing, generation, and formatting.

---

## What It Does

| User Message                                     | Agent Response                         |
| ------------------------------------------------ | -------------------------------------- |
| _"Give me a recipe for butter chicken"_          | Full recipe with ingredients and steps |
| _"Plan my meals for the week"_                   | 7-day breakfast, lunch, dinner plan    |
| _"What do I need to make pasta and salad?"_      | Merged grocery list by category        |
| _"How do I know when oil is hot enough to fry?"_ | Clear, friendly cooking answer         |

---

## Flow Structure

```
[API Request Trigger]
        ↓
[Recipe Supervisor Agent]
        ├──→ [Intent Detector LLM]
        │           ↓
        │    [Route by Intent - Condition Node]
        │           ├──→ [Recipe Generator LLM]
        │           ├──→ [Menu Planner LLM]
        │           ├──→ [Grocery List Builder LLM]
        │           └──→ [Cooking Q&A LLM]
        │
        ├──→ [Response Formatter (InstructorLLM)]
        ↓
[Agent Loop End]
        ↓
[API Response]
```

---

## Flow Components

This workflow uses the following node types:

- `graphqlNode` — API trigger that accepts the user message
- `agentNode` — Supervisor that orchestrates the full flow
- `agentLoopEndNode` — Closes the agent loop and returns the final response
- `LLMNode` — Intent Detector, Recipe Generator, Menu Planner, Grocery Builder, Cooking Q&A
- `conditionNode` — Routes to the correct sub-agent based on detected intent
- `InstructorLLMNode` — Formats the raw structured JSON into a clean user-facing response
- `graphqlResponseNode` — Returns the final output

---

## Files Included

- **config.json** — Complete flow structure with all nodes and edges
- **inputs.json** — Private inputs requiring configuration (Gemini API key)
- **meta.json** — Flow metadata and author information
- **README.md** — This file

---

## Setup Instructions

### 1. Import the template

Import this template into your Lamatic workspace via the Template Library or by uploading `config.json` directly.

### 2. Configure your API key

Open `inputs.json` and replace the placeholder with your actual key:

```json
{
  "GEMINI_API_KEY": "your_google_gemini_api_key_here"
}
```

You can get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

### 3. Test the flow

Use the built-in test input from `meta.json`:

```json
{
  "user_message": "Give me a recipe for butter chicken"
}
```

### 4. Deploy

Deploy the flow and integrate the API endpoint into your app or chat interface.

---

## Example Inputs & Outputs

### Recipe Generation

**Input:**

```json
{ "user_message": "Give me a recipe for chocolate lava cake" }
```

**Output:**

```
🍫 Chocolate Lava Cake (Serves 4)
Prep: 15 mins | Cook: 12 mins

Ingredients:
- 200g dark chocolate
- 100g butter
...

Steps:
1. Preheat oven to 200°C...
2. Melt chocolate and butter together...

#dessert #chocolate #quick
```

---

### Menu Planning

**Input:**

```json
{ "user_message": "Plan a healthy meal plan for 3 days" }
```

**Output:**

```
📅 Your 3-Day Meal Plan

Monday
🌅 Oats with berries and honey
🌞 Grilled chicken salad
🌙 Baked salmon with vegetables
...
```

---

### Grocery List

**Input:**

```json
{ "user_message": "What do I need to make pasta and caesar salad?" }
```

**Output:**

```
🛒 Grocery List (12 items)

Vegetables:
- 1 head romaine lettuce
- 2 cloves garlic

Dairy:
- 50g parmesan cheese
...
```

---

## Why This Agent

- **Single entry point** — One API call handles all recipe-related intents
- **Smart routing** — No need to pre-classify requests; the agent figures it out
- **Structured outputs** — Every sub-agent returns typed JSON before formatting
- **Extensible** — New intents (e.g. nutrition analysis, substitutions) can be added as new condition branches

---

## Tags

🍳 Food · 🤖 AI Agent · 🌱 Growth · 🛒 Grocery · 📅 Planning

---

_Exported from Lamatic Template Library_  
_Template: Recipe AI Agent_

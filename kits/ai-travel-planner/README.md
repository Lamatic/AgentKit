# ✈️ AI Travel Planner

An AI-powered travel planning agent built with Lamatic.ai that generates **complete, personalized travel guides** for any destination worldwide. Just describe your trip in natural language and get a comprehensive travel plan instantly.

## 🎯 What It Does

Send a message like _"Plan a 5-day trip to Tokyo on a $2000 budget, interested in food and culture"_ and get back:

- 📅 **Day-by-day itinerary** — Morning, afternoon & evening activities with specific places and timings
- 🏨 **Top 3 hotel recommendations** — Name, price range, location, and why it suits your style
- 🍜 **Must-try foods & restaurants** — Local dishes, restaurant names, and price ranges
- 🎒 **Complete packing list** — Categorized by clothing, toiletries, electronics, documents, and misc
- 💰 **Budget breakdown** — Markdown table with cost estimates per category
- 💡 **3 insider pro tips** — Local secrets most tourists never discover

## 🚀 Quick Start

### Prerequisites

- A [Lamatic.ai](https://lamatic.ai) account (free tier works)
- A [Groq API key](https://console.groq.com/keys) (free)

### Setup in Lamatic Studio

1. **Import the flow** into your Lamatic project
2. **Add Groq credentials** in Connections → Add Model → Groq → paste your API key
3. **Connect the model** to the `Generate Travel Plan` node → select `groq/llama-3.3-70b-versatile`
4. **Deploy** the flow

### Usage

Interact via the embedded chat widget. Example queries:

```
Plan a 7-day trip to Bali on a $1500 budget
```
```
Luxury 5-day Paris trip, interested in food and culture
```
```
Backpacker adventure in Thailand for 10 days, $800 budget
```
```
3-day trip to Goa, ₹15,000 budget, beaches and seafood
```

## 🏗️ Flow Architecture

```
Chat Trigger
    ↓
Parse Travel Inputs (extracts: destination, days, budget, style, interests)
    ↓
Generate Travel Plan (Groq LLM — llama-3.3-70b-versatile)
    ↓
Stream Travel Plan Response (chat output)
```

## ⚙️ Configuration

| Setting | Value |
|---------|-------|
| LLM Provider | Groq |
| Model | llama-3.3-70b-versatile |
| Trigger | Chat Widget |
| Output | Streaming Markdown |

## 📝 Example Output

```markdown
# 🌍 Your Travel Plan

## 📅 Day-by-Day Itinerary

### Day 1 — Arrival & Beach Time
🌅 Morning: Arrive at Goa airport, check in to hostel in Panaji...
☀️ Afternoon: Head to Calangute Beach, rent a shack lounger...
🌙 Evening: Sunset at Baga Beach, dinner at Britto's seafood...

## 🏨 Top 3 Hotel Recommendations
1. **Zostel Goa** — ₹800-1200/night, North Goa...

## 💰 Budget Breakdown
| Category | Estimated Cost | % of Budget |
|----------|---------------|-------------|
| Accommodation | ₹3,600 | 24% |
...
```

## 🤝 Contributing

This kit is part of [Lamatic AgentKit](https://github.com/Lamatic/AgentKit). Feel free to open issues or PRs!

## 📄 License

MIT — see [LICENSE](../../LICENSE)

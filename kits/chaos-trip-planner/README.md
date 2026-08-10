# 🌍 Chaos Trip Planner

**Tell us your vibe. We'll plan the trip.**

An AI trip planner that builds a day-by-day itinerary using real weather and real nearby places — not just guesses from an LLM.

---

## ✨ What is it?

You give it a city, your travel dates, your budget, and a few words about what you like ("I love historical places and street food"). It gives you back a full day-by-day plan — morning, afternoon, and evening — with a short reason for every recommendation, based on real weather and real places near your destination.

## 🧩 The problem it solves

Planning a trip usually means opening 5-6 tabs — weather, blogs, maps, budget spreadsheets — and putting it all together yourself. This does that in one step, and because it's grounded in real data, it doesn't just hand you a nice-sounding list that falls apart once you actually land there.

## ⚙️ How it works (built on Lamatic AgentKit)

Lamatic's visual flow builder to connect everything into one pipeline:

```
Your input (city, days, budget, vibe)
        │
        ▼
🗺️ Find the city's coordinates
        │
        ▼
📅 Work out the exact trip dates
        │
        ▼
🌦️ Get the real weather forecast
        │
        ▼
📍 Get real nearby places
        │
        ▼
🤖 AI reasons over all of it and builds the plan
        │
        ▼
Your results page
```

**One decision worth explaining:** the "find nearby places" step doesn't filter by what you said you like — it just grabs a broad mix of what's around. The AI does all the matching itself, looking at the full list and picking what actually fits your vibe. This keeps that part of the system simple and reusable, no matter what someone types in.

The AI is also told to only use real places from that list, and if it can't find something that matches (like if you asked for temples but there aren't any nearby in the data), it says so honestly instead of making one up.

## 🛠️ Built with

- **Lamatic AgentKit** — the flow connecting everything above
- **Open-Meteo** — free weather + location data
- **Geoapify** — free nearby-places data
- **Gemini 2.5 Flash** — the reasoning step
- **Next.js + TypeScript + Tailwind** — the website itself

## 🎯 What you get

A form to describe your trip, and a results page showing your day-by-day plan, the weather for each day, a short "why" for every recommendation, and a summary of how the whole plan fits your preferences.

## 🔮 Future enhancements

- Real booking prices for flights/hotels instead of an estimated budget split
- A map view showing all recommended places
- Support for weather further out than ~15 days, using seasonal averages instead of live forecasts
- Better handling for smaller or less-mapped towns where place data is sparse
- Letting users "replan" mid-trip if plans change (e.g. a day gets cancelled)

## 🚀 Setup & Usage

### Prerequisites

- Node.js 18+
- A [Lamatic](https://lamatic.ai) account with this flow deployed
- A Geoapify API key — used by the Places node inside the Lamatic flow

### Installation

```bash
cd apps
npm install
```

### Environment variables

Create a `.env.local` file inside `apps/`:

```
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_project_id
LAMATIC_ENDPOINT=your_project_endpoint_url
LAMATIC_FLOW_ID=your_flow_id
```

You'll find these values in your Lamatic project under **Settings → API Keys** and inside the deployed flow itself.

### Running locally

```bash
npm run dev
```

Then open `http://localhost:3000`.

### Using the app

1. Enter a city, travel date, number of days, and budget.
2. Add a few words about what you like (e.g. "historical places and street food").
3. Click **Generate My Trip**.
4. Wait ~20-30 seconds while the AI builds your itinerary.
5. View your day-by-day plan, complete with weather, recommendations, and the reasoning behind each choice.

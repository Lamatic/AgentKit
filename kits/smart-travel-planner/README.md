#  Smart Travel Planner

> An **Agentic AI-powered** travel planning platform built with **Next.js** and **Lamatic AI** that generates complete, structured travel itineraries with maps, photos, local food, cultural highlights, and an interactive chatbot.

---

##  Features

-  **AI-Generated Itineraries** — Day-wise structured travel plans powered by Lamatic AI LLM flows
-  **Live Maps** — OpenStreetMap embedded per day via Geocode API
-  **Destination & Day Photos** — Auto-fetched via Places API with lightbox viewer
-  **Local Food & Stay Suggestions** — Curated per day and per destination
-  **Cultural Highlights & Travel Tips** — Structured output from the LLM
-  **Floating Travel Chatbot** — Ask follow-up travel questions in real time
-  **Fallback Flow** — Condition-based routing ensures users always get a response
-  **GraphQL Workflow Execution** — Lamatic AI called via GraphQL `executeWorkflow` query

---

##  Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router, TypeScript) |
| Styling | CSS Modules / globals.css |
| AI Orchestration | Lamatic AI (Agentic Workflows via GraphQL) |
| Maps | OpenStreetMap (iframe embed) |
| Location | Geocode API (lat/lng resolution) |
| Photos | Google Places API |
| Language | TypeScript (TSX) |
| Runtime | Node.js |

---

##  Project Structure

```
smart-travel/
├── actions/
│   └── orchestrate.ts          # Lamatic AI workflow runners (GraphQL calls)
├── app/
│   ├── api/
│   │   ├── chatbot/
│   │   │   └── route.ts        # POST /api/chatbot → runs chatbot flow
│   │   ├── geocode/
│   │   │   └── route.ts        # GET /api/geocode?query= → lat/lng
│   │   ├── map-test/
│   │   │   └── route.ts        # Map sandbox/testing endpoint
│   │   ├── places/
│   │   │   └── route.ts        # GET /api/places?query= → photos[]
│   │   └── travel/
│   │       └── route.ts        # POST /api/travel → full itinerary
│   ├── map-test/
│   │   └── page.tsx            # Map test/debug page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/
│   ├── PlannerForm.tsx          # Main form + full itinerary UI
│   ├── FloatingChatbot.tsx      # Floating AI chat widget
│   ├── ItineraryDisplay.tsx     # Itinerary display component
│   └── DayCard.tsx              # Single day card component
├── lib/                         # Shared utilities
├── public/                      # Static assets
├── .env.local                   # Environment variables (not committed)
└── .gitignore
```

---

##  Lamatic AI Agent Flows

###  Travel Itinerary Flow

```
API Request  →  Code Node  →  LLM (Generate Itinerary)
                                        │
                               Condition Node (validate output)
                                ┌───────┴────────┐
                            Valid             Invalid
                         Refine Text        Fallback Text
                                └───────┬────────┘
                                   code2 Node (parse JSON)
                                        │
                                   API Response
```

| Node | Purpose |
|------|---------|
| **API Request** | Receives `destination`, `days`, `budget`, `destination_type` |
| **Code Node** | Pre-processes and formats input for the LLM |
| **Generate Itinerary (LLM)** | Core AI node — generates full structured travel plan |
| **Condition Node** | Validates output completeness and structure |
| **Refine Generate Text** | Cleans valid output into structured JSON |
| **Fallback Generate Text** | Generates a simpler plan if the main LLM fails |
| **code2 Node** | Final JSON parse and validation |
| **API Response** | Returns structured itinerary to the frontend |

###  Chatbot Flow

```
API Request (user message)  →  Generate Text (LLM)  →  API Response
```

The chatbot is scoped to travel-only questions: destinations, food, budget, culture, visas, and travel tips.

---

##  Lamatic Workflow Integration

All Lamatic AI flows are called through a shared GraphQL utility in `actions/orchestrate.ts`:

```typescript
// Generic workflow runner
export async function runLamaticWorkflow({ workflowId, payload }) {
  const res = await fetch(process.env.LAMATIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
      "x-project-id": process.env.LAMATIC_PROJECT_ID,
    },
    body: JSON.stringify({
      query: `
        query Execute($workflowId: String!, $payload: JSON!) {
          executeWorkflow(workflowId: $workflowId, payload: $payload) {
            status
            result
          }
        }
      `,
      variables: { workflowId, payload },
    }),
    cache: "no-store",
  });
}

// Travel agent — uses GLOBAL_TRAVEL_AGENT workflow
export async function runTravelAgent(input: {
  destination: string;
  days: number;
  budget: number;
  destination_type: string;
}) { ... }

// Chatbot agent — uses CHATBOT_FLOW_ID workflow
export async function runChatAgent({ message }: { message: string }) { ... }
```

---

##  Key Component — `PlannerForm.tsx`

The main component handles the complete UI lifecycle:

**State managed:**
```typescript
destination, days, budget, destinationType   // Form inputs
loading, response                             // Request state
activeDay                                     // Selected day tab
photos                                        // Destination photo gallery
lightboxImg                                   // Lightbox fullscreen image
dayLocation: { lat, lng }                     // Map coordinates per day
dayPhotos                                     // Per-day photo gallery
```

**Data flow on submit:**
```
handleSubmit()
  → POST /api/travel         (generate itinerary)
  → GET /api/places          (fetch destination photos)
  → fetchDayLocation()       (GET /api/geocode for Day 1 map)
  → fetchDayPhoto()          (GET /api/places for Day 1 photos)
```

**On day tab switch:**
```
onClick (Day tab)
  → fetchDayLocation(morning_location || afternoon_location || destination)
  → fetchDayPhoto(location)
```

**Map rendering** uses OpenStreetMap via iframe with dynamic bbox:
```typescript
src={`https://www.openstreetmap.org/export/embed.html
  ?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}
  &layer=mapnik&marker=${lat},${lng}`}
```

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/travel` | Generate full travel itinerary |
| `POST` | `/api/chatbot` | Send message to travel chatbot |
| `GET` | `/api/places?query=` | Fetch destination/place photos |
| `GET` | `/api/geocode?query=` | Resolve place name to lat/lng |

### Example — Generate Itinerary

**Request:**
```json
POST /api/travel
{
  "destination": "Bali",
  "days": 5,
  "budget": 1000,
  "destination_type": "beach"
}
```

**Response shape:**
```typescript
{
  success: boolean;
  itinerary: {
    destination: string;
    country: string;
    introduction: string;
    best_time_to_visit: string;
    estimated_budget: string;
    highlights: { name: string; description: string }[];
    food: { name: string; description: string }[];
    culture: string[];
    travel_tips: string[];
    days: {
      day: number;
      title: string;
      morning: string;
      afternoon: string;
      evening: string;
      morning_location?: string;
      afternoon_location?: string;
      evening_location?: string;
      food_recommendation: string;
      stay_suggestion: string;
      estimated_day_cost: string;
      notes: string;
    }[];
  }
}
```

---

##  Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Lamatic AI account with configured workflows
- Google Places API key
- Geocoding API key

### Installation

```bash
git clone https://github.com/your-username/smart-travel.git
cd smart-travel
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Lamatic AI
LAMATIC_API_URL=https://your-lamatic-endpoint/graphql
LAMATIC_API_KEY=your_lamatic_api_key
LAMATIC_PROJECT_ID=your_project_id
GLOBAL_TRAVEL_AGENT=your_travel_workflow_id
CHATBOT_FLOW_ID=your_chatbot_workflow_id

# APIs
GOOGLE_PLACES_API_KEY=your_google_places_api_key
GEOCODE_API_KEY=your_geocode_api_key
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

##  Built With Lamatic AI

This project was built for the **Lamatic AI Agentic Kit Challenge**. It uses Lamatic's agentic flow infrastructure with multi-node pipelines, condition-based routing, structured JSON outputs, and fallback handling — all connected to a Next.js frontend.

---

##  Acknowledgements

- [Lamatic AI](https://lamatic.ai) — Agentic workflow platform
- [Next.js](https://nextjs.org) — Frontend framework
- [OpenStreetMap](https://openstreetmap.org) — Embedded maps
- Google Places & Geocode APIs — Photos and location resolution

---

##  License

MIT License — feel free to use and adapt this project.

---


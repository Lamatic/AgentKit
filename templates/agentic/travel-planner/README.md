# Lamatic Multi-Agent Travel Planner

Design flight-ready itineraries with Lamatic’s multi-agent coordination stack. This template wires the Lamatic workflow you deployed (project `bee05145-3d20-4d4b-a965-75ec69cc4a65`) into a polished Next.js front-end so travellers can collect flights, stays, activities, budgets, visualisations, and booking steps in one place.

![Travel planner hero](https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=60)

---

## ✨ What’s inside

- **Preference capture UI** – guided form with origin/destination, dates, budget, travellers, cabin class, and up to three interests.
- **Lamatic orchestration** – calls the `Multi-Agent Travel Planner` flow (`3cc791a2-ca33-4e27-8791-ff386cef14b2`). The trigger node fans out to flight, hotel, and activity sub-flows and returns a structured brief.
- **Itinerary visualiser** – renders overview, day-by-day plan, flight & stay cards, activity gallery, budget breakdown, booking checklist, and raw payload inspector.
- **Travel-first styling** – airy gradients, travel-inspired hero, and badge-based highlights for an easy hand-off to marketing or ops teams.
- **Friendly UX touches** – date pickers prevent past departures and the response is reformatted into polished cards for trip summary, flights, lodgings, tips, and booking steps.

---

## 🚀 Quick start

> Make sure you have exported your Lamatic deployment (`lamatic-config.json`) and Lamatic API key (`LAMATIC_API_KEY`).

1. **Install dependencies**
   ```bash
   cd templates/agentic/travel-planner
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   # add your Lamatic key
   ```

3. **Run locally**
   ```bash
   npm run dev
   # open http://localhost:3000
   ```

4. **Deploy (optional)**
   - Create a new Vercel project with root set to `templates/agentic/travel-planner`.
   - Add `LAMATIC_API_KEY` to the Vercel environment variables.
   - Upload the same `lamatic-config.json` that you exported from Lamatic Studio.

---

## 🧠 Workflow architecture

| Stage | Lamatic node | Description |
| ----- | ------------ | ----------- |
| Trigger | `triggerNode_1` | Receives the form payload, validates schema (`origin`, `destination`, `start_date`, `end_date`, `budget`, `interests[]`, `travelers`, `flight_class`). |
| Coordinator | `LLMNode_113` + `codeNode_405` | Builds aggregated search parameters: budget splits, IATA codes, trip summary. |
| Specialists | `flowNode_122`, `flowNode_175`, `flowNode_506` | Dedicated sub-flows for flights, hotels, and activities using the structured queries. |
| Synthesis | `LLMNode_310` + `codeNode_827` | Produces the final travel brief, day-by-day itinerary, budget ledger, tips, and booking next steps. |
| Response | `responseNode_triggerNode_1` | Returns the JSON payload consumed by this Next.js template. |

All flow metadata (workflow ID, Lamatic endpoint, project ID) live in [`lamatic-config.json`](./lamatic-config.json).

---

## 🖥️ Front-end tour

| Module | Path | Notes |
| ------ | ---- | ----- |
| Lamatic client | [`lib/lamatic-client.ts`](./lib/lamatic-client.ts) | Thin wrapper around the Lamatic SDK using the config + API key. |
| Orchestrator | [`actions/orchestrate.ts`](./actions/orchestrate.ts) | Cleans preferences, executes the travel flow, and normalises the JSON (flights, stays, activities, budget, tasks, visualisations). |
| UI | [`app/page.tsx`](./app/page.tsx) | Preference form, preset starter trips, loading states, itinerary renderer, and raw payload viewer. |

Custom helpers in `actions/orchestrate.ts` normalise the Lamatic response so the UI can be data-driven regardless of provider formatting.

---

## 🧩 Required inputs

- **Origin & destination** – plain text; Lamatic turn will map to IATA codes.
- **Dates** – ISO `YYYY-MM-DD`.
- **Budget** – per-trip amount in USD (update front-end copy if you use another currency).
- **Travellers** – integer; fed to flight and hotel agents.
- **Flight class** – `economy`, `premium_economy`, `business`, `first`.
- **Interests** – up to three tags (`art`, `food`, `history`, `adventure`, `nature`, `shopping`, `nightlife`, `culture`, `family`, `music`, `architecture`). These route requests to the activity analyst.
- **Optional notes** – appended as `"notes: ..."`, giving agents extra context (dietary needs, remote work, accessibility, etc.).

---

## 🛠️ Customisation tips

- Swap the preset journeys (`PRESET_TRIPS` in `app/page.tsx`) for your audience.
- Add more interest tags or rename them in `ACTIVITY_OPTIONS`, but keep the cap at 3 to respect the downstream agents.
- Extend the normalisers in `actions/orchestrate.ts` if your flow returns additional data (e.g., car rentals, insurance).
- Update the colour palette or background photography by adjusting the header block in `app/page.tsx`.

---

## ✅ Validation checklist

- [ ] `LAMATIC_API_KEY` present in `.env.local`.
- [ ] `lamatic-config.json` copied from Lamatic Studio (contains your workflow ID + endpoint).
- [ ] `npm run dev` boots without runtime errors.
- [ ] Form submission returns a full itinerary, references, and booking list in the UI.
- [ ] Raw payload viewer shows the JSON delivered by Lamatic (useful for debugging or exporting).

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE). Have fun building! 🧳✈️

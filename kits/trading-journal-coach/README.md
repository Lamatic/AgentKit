# Trading Journal Coach

An AI coach that reads your **own executed trades** and tells you the behavioural truth your journal is hiding — revenge trading, breaking your one-trade-a-day rule, holding losers while cutting winners, sizing past your risk budget. Then you can chat with your history and get a weekly discipline report on Slack.

Built on [Lamatic](https://lamatic.ai) for the AgentKit challenge. **This is discipline coaching, not financial advice** — it never tells you what to buy; it coaches how you behave.

> Live demo: _add Vercel URL after deploy_ · Walkthrough video: _add link_

---

## The problem

Retail options traders keep journals but almost never extract behavioural truth from them. A spreadsheet of trades tells you _what_ happened; it doesn't tell you that you lose money mainly on the trades you take **after** your first one, or that you re-enter within minutes of a loss at bigger size. Those patterns are where the money leaks — and they're invisible without analysis.

## The approach — 3 flows

The work is split into three small Lamatic flows instead of one big prompt, so each piece stays testable and the reasoning is legible:

1. **`analyze-journal`** (API). A deterministic code node computes the metrics (win rate, profit factor, payoff, drawdown, streaks, time-of-day/day-of-week P&L, revenge episodes, size drift, hold asymmetry). A branch returns an honest "not enough data yet" under ~20 trades. Then **two** LLM nodes run in sequence — a **pattern-detector** (metrics → structured behavioural patterns) and a **coach** (patterns → severity-ranked findings, each with one concrete rule-change). Separating detection from coaching is the multi-phase pattern that keeps each prompt small and every number grounded.
2. **`chat-with-journal`** (chat). Ask questions about your own history ("what's my worst habit?", "how much did revenge cost me?"). Answers come only from your analysis + your saved rules — never invented.
3. **`weekly-discipline-report`** (cron). Reuses `analyze-journal` via an execute-flow node (no duplicated logic), summarizes the week, and posts a short discipline report to Slack.

**Why it's grounded:** every figure the LLMs cite is computed deterministically first (`flows/scripts/…compute-metrics`). The constitution forbids inventing numbers not present in the data.

## The result

On the included 121-trade sample (a deliberately undisciplined trader), the coach surfaces, with evidence:

- Broke the one-trade-a-day rule on **33 of 44 days** — those extra trades cost **₹30,314**.
- **59 revenge trades** (39 within 15 minutes of a loss) cost **₹20,932**.
- Average loser held **3.57× longer** than the average winner (holds losers, cuts winners).
- Average loss **2.37×** the ₹500 risk budget for a 1% risk on ₹50,000.

…and a single top priority: trade once a day and stop after a loss.

## What it encodes (the trader's own system)

The thresholds are a real NSE options trader's rules, not generic defaults: **one trade per day**, **no revenge trades**, **size off a ₹50,000 account at 1:3 R:R** (₹500 risk / ₹1,500 target at 1%), **cut losers / let winners run**, primary windows **open 09:15–10:00** and **close 14:45–15:30**.

## Screenshots

_Add after first run: (1) upload screen, (2) dashboard with equity/drawdown + coaching findings, (3) chat panel._

## Run it locally

The app runs immediately in **preview mode** — it computes real metrics and charts from your CSV locally, so you can try it before connecting any flows. Connect the flows to unlock AI pattern detection, coaching, and chat.

```bash
cd kits/trading-journal-coach/apps
cp .env.example .env.local     # fill in after deploying the flows (see below)
npm install
npm run dev                     # http://localhost:3000 — click "Use sample data"
```

### Connect the Lamatic flows
1. Build & deploy the three flows in [Lamatic Studio](https://studio.lamatic.ai) (node-by-node build sheets accompany this kit).
2. Copy each **Flow ID** and your API credentials into `.env.local`:
   - `ANALYZE_JOURNAL_FLOW_ID`, `CHAT_WITH_JOURNAL_FLOW_ID`, `WEEKLY_DISCIPLINE_REPORT_FLOW_ID`
   - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`
3. Restart `npm run dev`. The dashboard now shows AI coaching and chat answers.

## CSV format

`date, symbol, side, qty, entry, exit, pnl` (optional `exitDate`, `notes`). Example:

```csv
date,symbol,side,qty,entry,exit,pnl,exitDate,notes
2026-06-03T09:45:00+05:30,NIFTY24JUL24500CE,long,2,100,112,1200,2026-06-03T09:59:00+05:30,booked quick
```

`assets/sample-trades.csv` is **synthetic** (~120 trades, seeded, clearly not real trades) and embodies detectable patterns so the coaching has something to work with.

## Tradeoffs & assumptions (stated honestly)

- **CSV parsed client-side** (papaparse). Keeps the flow clean and the demo robust — it never depends on a file being reachable server-side.
- **Normalized R:** true 1:3 R:R needs a per-trade stop/risk column, which the v1 schema doesn't have. R is normalized by average loss and labeled as such. Adding a stop column (v1.1) enables true R:R vs the 1:3 target.
- **Sizing benchmark** assumes **1% risk (₹500/trade)** on ₹50,000 (2% also computed). Exact lots need the stop column.
- **Chat uses the stored analysis as context** rather than full vector RAG — bulletproof for the demo; vector RAG is the enhancement.
- **Weekly report** reads the latest trades from a store the app writes to (seeded with the sample for the demo).
- **Lot size / contract multiplier** not modeled; `qty` is treated as lots.

## Roadmap (v1.1)

Stop-column for true R:R · adding-to-open-losers detection · expiry-day behaviour · trend-over-time ("am I improving?") once multiple analyses are stored · true vector RAG over the journal.

## Built on Lamatic — what worked, what fought me

_(filled from the build log for the PR — 3–5 honest, specific notes.)_

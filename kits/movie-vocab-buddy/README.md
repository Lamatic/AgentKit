# Movie Vocab Buddy

Learn English vocabulary and phrases straight from the movies and shows you
watch. Paste a transcript or subtitle file after finishing an episode, and
get back a personal vocabulary deck: each word explained, shown in the line
it actually appeared in, given two original example sentences, and tagged
with a difficulty level. Saved words build into a Kindle-highlights-style
library, reinforced with a light quiz right after watching and a weekly
spaced-repetition quiz that brings back what you're still shaky on.

## Why this exists

Most language tools teach vocabulary in isolation. This one grounds every
word in media you actually watched — the context, tone, and real usage are
part of the lesson, not an afterthought.

## How it works

1. **Extract vocabulary** — paste a subtitle/transcript, get 10–15 notable
   words/phrases with meaning, source line, two examples, and a difficulty
   tag (beginner/intermediate/advanced). Nothing is filtered out by level —
   you filter the *view*, not the extraction.
2. **Post-movie quiz** — a quick, low-stakes multiple-choice + fill-in-blank
   quiz from the words you just learned. Doesn't affect long-term tracking.
3. **Library** — every word you've ever saved, paginated, filterable by
   difficulty and source.
4. **Weekly quiz** — runs on a schedule. Pulls words you've missed or never
   nailed twice in a row, mixed with a random sample from your library.
   Only this quiz updates retention state (`correct_count`, `last_reviewed`).
5. **Review missed words** — a spaced-repetition page that pulls whichever
   words you've gotten wrong the most (across the post-movie and weekly
   quizzes) and builds a focused practice quiz from just those.

## Flows

| Flow | Trigger | Purpose |
|---|---|---|
| `extract-vocabulary` | manual (transcript upload) | Extract + tag + store words |
| `post-movie-quiz` | manual (right after extraction) | Quick reinforcement quiz |
| `weekly-quiz` | schedule (weekly) | Spaced-repetition quiz + retention update |

## Setup

1. Run `schema.sql` against a Postgres database.
2. In Lamatic Studio, recreate the three flows in `flows/` (or import if
   your Studio version supports it), using the prompts in `prompts/` and
   scripts in `scripts/`. Deploy each and copy its Flow ID.
3. `cd apps && cp .env.example .env.local` and fill in your Lamatic API
   key/project ID, the two flow IDs (`weekly-quiz` runs on a Studio cron
   trigger, not an API call, so it has no flow ID env var), and your
   `DATABASE_URL`.
4. `npm install && npm run dev`

## Stack

Lamatic Studio (flow orchestration + LLM nodes) · Next.js · Postgres

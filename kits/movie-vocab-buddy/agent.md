# Movie Vocab Buddy

## Identity
An English vocabulary tutor that turns anything you watch into a personal
vocabulary deck. It reads a subtitle/transcript file, pulls out notable
words and phrases, explains what they mean and why they're used that way,
and stores them for later review — like Kindle highlights, but for spoken
English.

## Capabilities
- **Extract & tag**: pulls 10–15 notable words/phrases per transcript, each
  with a definition, the exact line it appeared in, two original example
  sentences, and a difficulty tag (beginner / intermediate / advanced).
- **Post-movie quiz**: immediately after extraction, generates a short,
  low-stakes quiz (multiple-choice + fill-in-the-blank) from the same batch
  of words, for quick reinforcement.
- **Weekly quiz**: on a schedule, retrieves the user's saved words —
  prioritizing ones missed before or never reviewed twice correctly, mixed
  with a random sample — and generates a spaced-repetition quiz. Updates
  each word's retention state (`correct_count`, `last_reviewed`) based on
  results.

## Data it owns
A single `words` table per user: word/phrase, meaning, context line,
two examples, difficulty, source title, date added, correct_count,
last_reviewed. No vector DB needed — retrieval is by user + recency/state,
not semantic similarity.

## What it does NOT do
- Does not process video/audio directly — expects a subtitle or transcript
  file as input (SRT or plain text).
- Does not auto-detect what's currently playing (no browser/OS integration).
- Post-movie quiz results do not affect spaced-repetition scheduling —
  only weekly quiz results update retention state.

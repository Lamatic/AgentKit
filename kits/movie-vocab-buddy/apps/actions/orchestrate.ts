"use server";

import { callFlow } from "../lib/lamatic-client";
import { Client } from "pg";

// Parses a JSON-encoded string safely, tolerating null/undefined/empty
// strings and logging the raw value if parsing still fails so we can see
// exactly what the flow actually returned instead of a bare stack trace.
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Lamatic's template substitution for `{{node.output.words_json}}` inside a
// quoted string field pastes the array's JSON text in verbatim (rather than
// escaping it as a string), which leaves stray trailing characters after the
// array's closing `]` (e.g. an extra `}` from the surrounding template). If a
// straight JSON.parse fails, find the last `]` in the string and try parsing
// just the array up to (and including) that point before giving up.
function repairTrailingJunk(str: string): string | null {
  const firstBracket = str.indexOf("[");
  const lastBracket = str.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) return null;
  return str.slice(firstBracket, lastBracket + 1);
}

function safeParseArray(raw: unknown, label: string): any[] {
  if (raw == null || raw === "") return [];
  if (Array.isArray(raw)) return raw;
  const strValue = String(raw);

  const attempts = [
    strValue,
    decodeHtmlEntities(strValue),
    repairTrailingJunk(strValue),
    repairTrailingJunk(decodeHtmlEntities(strValue)),
  ];

  let lastErr: unknown = null;
  for (const attempt of attempts) {
    if (attempt == null) continue;
    try {
      const parsed = JSON.parse(attempt);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      lastErr = err;
    }
  }

  console.error(`[${label}] failed to parse flow output as JSON:`, raw);
  const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(`${label}: flow returned unparseable output (${errMsg}; see server logs)`);
}

// ---- API-triggered flows (called live from the frontend) -----------------

// Neon's free-tier connection sometimes drops/fails transiently, and the
// Postgres node then returns { error: "Unable to query database" } with an
// HTTP 200 (the flow itself "succeeded", it just couldn't reach the DB).
// Previously this silently became an empty words list with no visible error.
// Now we detect it explicitly and retry a couple of times before giving up.
function isDbError(result: unknown): string | null {
  // Lamatic's GraphQL `result` field can come back as an already-parsed
  // object OR as a JSON-encoded string (depending on the flow's schema) --
  // handle both, otherwise a string-encoded error object silently slips
  // past this check and gets treated as a normal (empty) result.
  let value: unknown = result;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (value && typeof value === "object" && "error" in (value as any)) {
    return String((value as any).error);
  }
  return null;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function extractVocabulary(input: {
  transcript_text: string;
  source_title: string;
  user_id: string;
}) {
  // The extract-vocabulary flow now does LLM extraction ONLY (its Postgres
  // node was buggy — it reliably failed with "Unable to query database" even
  // though the same INSERT ran fine directly against Neon). The flow's API
  // Response now returns the Generate JSON node's words_json directly, and we
  // perform the actual word_batches INSERT here ourselves via pg.Client(),
  // mirroring the already-working direct-DB pattern used by getLibrary /
  // getLatestWeeklyQuiz below.
  const MAX_ATTEMPTS = 5;
  let lastError: string | null = null;
  let words: any[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const { result } = await callFlow("extract-vocabulary", input);
    console.log(`[extractVocabulary] attempt ${attempt} raw result:`, result);

    const dbError = isDbError(result);
    if (dbError) {
      lastError = dbError;
      console.warn(`[extractVocabulary] attempt ${attempt} failed: ${dbError}`);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(3000 * attempt);
        continue;
      }
      throw new Error(
        `Could not extract your vocabulary (error: "${dbError}"). Please try again in a few seconds.`
      );
    }

    // Our API Response schema's own output key happens to also be named
    // "result", so the GraphQL `result` field comes back as { result: "<json
    // array string>" } — one extra layer of nesting versus a bare string.
    let inner: unknown = result;
    if (inner && typeof inner === "object" && "result" in (inner as any)) {
      inner = (inner as any).result;
    } else if (typeof inner === "string") {
      try {
        const parsed = JSON.parse(inner);
        if (parsed && typeof parsed === "object" && "result" in parsed) {
          inner = parsed.result;
        }
      } catch {
        // not a JSON-wrapped object — leave inner as the raw string
      }
    }

    words = safeParseArray(inner, "extractVocabulary");
    lastError = null;
    break;
  }

  if (lastError) {
    throw new Error(lastError);
  }

  // Now persist the extracted words ourselves, directly against Neon.
  // Explicit timeouts so a stuck/cold connection fails fast with a clear
  // error instead of hanging the request indefinitely.
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO word_batches (user_id, source_title, words_json)
       VALUES ($1, $2, $3::jsonb)`,
      [input.user_id, input.source_title, JSON.stringify(words)]
    );
  } finally {
    await client.end();
  }

  return { words };
}

export async function generatePostMovieQuiz(input: { extracted_words_json: string }) {
  // This flow's LLM/templating output is occasionally malformed (same
  // class of issue as extract-vocabulary's trailing-junk quirk — sometimes
  // it's just a truncated/incomplete response). Retry a few times before
  // surfacing an error, same pattern as extractVocabulary.
  const MAX_ATTEMPTS = 3;
  let lastErr: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const { result } = await callFlow("post-movie-quiz", input);
      console.log(`[generatePostMovieQuiz] attempt ${attempt} raw result:`, result);

      // Same nesting quirk as extract-vocabulary: our own API Response schema
      // key may itself be named the same as an inner field, and Lamatic's
      // template substitution can wrap/paste values in unexpected shapes
      // depending on the field's declared type. Try several reasonable
      // unwrappings before giving up.
      let inner: unknown = result;
      if (typeof inner === "string") {
        try {
          inner = JSON.parse(inner);
        } catch {
          // leave as string — might be the quiz JSON itself, handled below
        }
      }
      if (inner && typeof inner === "object" && "quiz_json" in (inner as any)) {
        inner = (inner as any).quiz_json;
      } else if (inner && typeof inner === "object" && "result" in (inner as any)) {
        inner = (inner as any).result;
        if (inner && typeof inner === "object" && "quiz_json" in (inner as any)) {
          inner = (inner as any).quiz_json;
        }
      }

      const quiz = safeParseArray(inner, "generatePostMovieQuiz");
      return { quiz };
    } catch (err) {
      lastErr = err;
      console.warn(`[generatePostMovieQuiz] attempt ${attempt} failed:`, err);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(1500 * attempt);
        continue;
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("generatePostMovieQuiz failed after retries");
}

// ---- weekly-quiz (Cron-triggered in Studio, read-only from the frontend) --

export async function getLatestWeeklyQuiz(input: { user_id: string }) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      `SELECT id, quiz_json, generated_at
       FROM weekly_quizzes
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [input.user_id]
    );
    if (result.rows.length === 0) return { quiz: null, generatedAt: null };
    const row = result.rows[0];
    return { quiz: row.quiz_json, generatedAt: row.generated_at };
  } finally {
    await client.end();
  }
}

// ---- Spaced repetition: track quiz mistakes, resurface them later ---------

// word_mistakes is created lazily on first use rather than via a separate
// migration step — keeps this self-contained and avoids depending on manual
// SQL Editor steps in Neon, since we already know direct pg.Client() writes
// against this DB work reliably.
async function ensureMistakesTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS word_mistakes (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      term TEXT NOT NULL,
      meaning TEXT,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, term)
    )
  `);
}

// Call this every time a quiz question is answered (post-movie quiz or
// weekly quiz). Wrong answers accumulate a "how much does this need
// review" score; correct answers pull it back down but never remove the
// row entirely, so a word that's been missed before still has a hint of
// priority even after eventually being answered right.
export async function recordQuizAttempt(input: {
  user_id: string;
  term: string;
  meaning?: string;
  correct: boolean;
}) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  await client.connect();
  try {
    await ensureMistakesTable(client);
    await client.query(
      `INSERT INTO word_mistakes (user_id, term, meaning, wrong_count, correct_count, last_seen_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, term) DO UPDATE SET
         meaning = COALESCE(EXCLUDED.meaning, word_mistakes.meaning),
         wrong_count = word_mistakes.wrong_count + $4,
         correct_count = word_mistakes.correct_count + $5,
         last_seen_at = now()`,
      [input.user_id, input.term, input.meaning ?? null, input.correct ? 0 : 1, input.correct ? 1 : 0]
    );
  } finally {
    await client.end();
  }
}

// Returns the words most worth reviewing right now: prioritized by how many
// times they've been missed relative to how many times they've been
// answered correctly, so a word missed 3 times and gotten right once still
// outranks one missed once and gotten right once.
export async function getWordsToReview(input: { user_id: string; limit?: number }) {
  const limit = input.limit ?? 8;
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  await client.connect();
  try {
    await ensureMistakesTable(client);
    const result = await client.query(
      `SELECT term, meaning, wrong_count, correct_count, last_seen_at
       FROM word_mistakes
       WHERE user_id = $1 AND wrong_count > 0
       ORDER BY (wrong_count - correct_count) DESC, last_seen_at DESC
       LIMIT $2`,
      [input.user_id, limit]
    );
    return { words: result.rows };
  } finally {
    await client.end();
  }
}

// ---- Library (straight DB reads — no LLM call needed) ---------------------

export async function getLibrary(input: {
  user_id: string;
  difficulty?: string;
  page: number;
  pageSize?: number;
}) {
  const pageSize = input.pageSize ?? 20;
  const offset = (input.page - 1) * pageSize;

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // word_batches stores one row per extraction: { id, user_id, source_title,
    // words_json (jsonb array of word objects), date_added }. Flatten every
    // batch's words_json into a single list, newest batch first, then
    // paginate and optionally filter by difficulty in JS — this keeps the
    // SQL simple since difficulty lives inside the JSON blob, not a column.
    const batches = await client.query(
      `SELECT id, source_title, words_json, date_added
       FROM word_batches
       WHERE user_id = $1
       ORDER BY date_added DESC`,
      [input.user_id]
    );

    type Word = Record<string, any>;
    let allWords: Word[] = [];
    for (const batch of batches.rows) {
      const words: Word[] = Array.isArray(batch.words_json)
        ? batch.words_json
        : JSON.parse(batch.words_json ?? "[]");
      for (const w of words) {
        allWords.push({ ...w, source_title: batch.source_title, date_added: batch.date_added });
      }
    }

    if (input.difficulty) {
      allWords = allWords.filter((w) => w.difficulty === input.difficulty);
    }

    const total = allWords.length;
    const words = allWords.slice(offset, offset + pageSize);

    return { words, page: input.page, pageSize, total };
  } finally {
    await client.end();
  }
}
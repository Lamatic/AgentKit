// @ts-nocheck
import { Client } from "pg";

interface QuizResult {
  word_id: number;
  correct: boolean;
}

// Lamatic Code nodes take no input argument — the submitted results come
// from the manual "submit" trigger via a template variable at deploy time.
const RESULTS = "{{SubmitTrigger.results}}";

export default async function run() {
  const results: QuizResult[] = JSON.parse(RESULTS);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    if (results.length === 0) {
      return { updated: 0 };
    }

    // Single batched UPDATE via unnest() instead of one round-trip per row.
    const wordIds = results.map((r) => r.word_id);
    const corrects = results.map((r) => r.correct);

    await client.query(
      `UPDATE words AS w
       SET correct_count = CASE WHEN u.correct THEN w.correct_count + 1 ELSE 0 END,
           last_reviewed = now()
       FROM (
         SELECT * FROM unnest($1::int[], $2::boolean[]) AS t(word_id, correct)
       ) AS u
       WHERE w.id = u.word_id`,
      [wordIds, corrects]
    );

    return { updated: results.length };
  } finally {
    await client.end();
  }
}
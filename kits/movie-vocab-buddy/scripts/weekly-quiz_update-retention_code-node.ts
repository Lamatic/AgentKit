// Called after the user submits their weekly quiz answers.
// Updates correct_count and last_reviewed for each word based on results.
// This is the ONLY place retention state is written — post-movie quiz
// results never touch this table.

import { Client } from "pg";

interface QuizResult {
  word_id: number;
  correct: boolean;
}

export default async function run(input: { results: QuizResult[] }) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  for (const r of input.results) {
    await client.query(
      `UPDATE words
       SET correct_count = CASE WHEN $2 THEN correct_count + 1 ELSE 0 END,
           last_reviewed = now()
       WHERE id = $1`,
      [r.word_id, r.correct]
    );
  }

  await client.end();
  return { updated: input.results.length };
}

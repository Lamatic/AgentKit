// Selects the word set for the weekly quiz using spaced repetition + random fill.
// Rule:
//   1. Words missed last time they were quizzed (weekly-only) go back in.
//   2. Words with correct_count < 2 (never "graduated") go back in.
//   3. Remaining quiz slots (up to a target of 10) are filled with a random
//      sample from the rest of the user's saved words.
// Words with correct_count >= 2 and not missed are considered "graduated"
// and are excluded unless needed to fill slots.

import { Client } from "pg";

const TARGET_QUIZ_SIZE = 10;

export default async function run(input: { user_id: string }) {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const dueForReview = await client.query(
    `SELECT * FROM words
     WHERE user_id = $1 AND correct_count < 2
     ORDER BY last_reviewed ASC NULLS FIRST
     LIMIT $2`,
    [input.user_id, TARGET_QUIZ_SIZE]
  );

  let selected = dueForReview.rows;

  if (selected.length < TARGET_QUIZ_SIZE) {
    const remaining = TARGET_QUIZ_SIZE - selected.length;
    const excludeIds = selected.map((w) => w.id);
    const randomFill = await client.query(
      `SELECT * FROM words
       WHERE user_id = $1 AND id != ALL($2::int[])
       ORDER BY random()
       LIMIT $3`,
      [input.user_id, excludeIds.length ? excludeIds : [0], remaining]
    );
    selected = selected.concat(randomFill.rows);
  }

  await client.end();
  return { words: selected };
}

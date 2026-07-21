// @ts-nocheck
import { Client } from "pg";

const TARGET_QUIZ_SIZE = 10;

const USER_ID = "{{ScheduleTrigger.user_id}}";

export default async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const dueForReview = await client.query(
      `SELECT * FROM words
       WHERE user_id = $1 AND correct_count < 2
       ORDER BY last_reviewed ASC NULLS FIRST
       LIMIT $2`,
      [USER_ID, TARGET_QUIZ_SIZE]
    );

    let selected = dueForReview.rows;

    if (selected.length < TARGET_QUIZ_SIZE) {
      const remaining = TARGET_QUIZ_SIZE - selected.length;
      const excludeIds = selected.map((w) => w.id);
      // Postgres handles an empty array natively with `!= ALL($2::int[])`,
      // so there's no need for a placeholder [0] sentinel value.
      const randomFill = await client.query(
        `SELECT * FROM words
         WHERE user_id = $1 AND id != ALL($2::int[])
         ORDER BY random()
         LIMIT $3`,
        [USER_ID, excludeIds, remaining]
      );
      selected = selected.concat(randomFill.rows);
    }

    return { words: selected };
  } finally {
    await client.end();
  }
}
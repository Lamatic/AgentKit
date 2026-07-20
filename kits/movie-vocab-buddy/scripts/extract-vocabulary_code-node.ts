// Parses the LLM's JSON output and writes rows into the `words` table.
// Runs as a Code node right after the extraction LLM node in Lamatic Studio.

import { Client } from "pg";

interface ExtractedWord {
  term: string;
  meaning: string;
  context_line: string;
  example_1: string;
  example_2: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  why_used: string;
}

export default async function run(input: {
  llm_output: string;
  user_id: string;
  source_title: string;
}) {
  const words: ExtractedWord[] = JSON.parse(input.llm_output);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const inserted = [];
  for (const w of words) {
    const result = await client.query(
      `INSERT INTO words
        (user_id, word_or_phrase, meaning, context_line, example_1, example_2,
         difficulty, source_title, date_added, correct_count, last_reviewed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), 0, NULL)
       RETURNING *`,
      [
        input.user_id,
        w.term,
        w.meaning,
        w.context_line,
        w.example_1,
        w.example_2,
        w.difficulty,
        input.source_title,
      ]
    );
    inserted.push(result.rows[0]);
  }

  await client.end();
  return { words: inserted };
}

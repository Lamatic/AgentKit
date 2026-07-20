CREATE TABLE IF NOT EXISTS word_batches (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  source_title TEXT NOT NULL,
  words_json   JSONB NOT NULL,
  date_added   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_word_batches_user ON word_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_word_batches_user_date ON word_batches(user_id, date_added DESC);

CREATE TABLE IF NOT EXISTS weekly_quizzes (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  quiz_json    JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_quizzes_user_date ON weekly_quizzes(user_id, generated_at DESC);

-- Tracks per-word quiz performance so missed words can be resurfaced for
-- focused review (spaced repetition). Also created at runtime via
-- ensureMistakesTable() if this table doesn't exist yet.
CREATE TABLE IF NOT EXISTS word_mistakes (
  id           SERIAL PRIMARY KEY,
  user_id      TEXT NOT NULL,
  term         TEXT NOT NULL,
  meaning      TEXT,
  wrong_count  INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, term)
);

CREATE INDEX IF NOT EXISTS idx_word_mistakes_user ON word_mistakes(user_id);
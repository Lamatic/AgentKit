-- Durable idempotency keys for settle/refund paths.
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

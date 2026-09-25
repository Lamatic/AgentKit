-- Enable Realtime on all 8 tables so the dashboard can subscribe to live changes.
-- Repeatable: each addition is guarded by pg_publication_tables membership so
-- reruns add only missing tables and let subsequent statements continue.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['agents', 'bounties', 'bids', 'escrows', 'deliveries', 'qa_verdicts', 'credit_ledger', 'settlement_receipts']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END;
$$;

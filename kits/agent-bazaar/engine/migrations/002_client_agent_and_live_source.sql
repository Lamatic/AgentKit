-- 002_client_agent_and_live_source.sql
-- Agent Bazaar: allow a dedicated client/poster agent and live ledger sources.
--
-- The original schema constrained agents.specialty to the three worker
-- specialties and credit_ledger.source to ('seed','cron','manual').
-- The interactive engine writes client agents and live ledger entries,
-- so both constraints are widened. Safe to run more than once.

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_specialty_check;
ALTER TABLE agents
  ADD CONSTRAINT agents_specialty_check
  CHECK (specialty IN ('summarizer', 'researcher', 'datagen', 'client'));

ALTER TABLE credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_source_check;
ALTER TABLE credit_ledger
  ADD CONSTRAINT credit_ledger_source_check
  CHECK (source IN ('seed', 'cron', 'manual', 'live'));

-- Stable append-order key: created_at defaults to now(), which returns the
-- transaction start time, so rows written in one transaction share identical
-- timestamps and ORDER BY created_at is nondeterministic. The identity
-- sequence is monotonic per append and safe to order by.
ALTER TABLE credit_ledger ADD COLUMN IF NOT EXISTS seq bigint GENERATED ALWAYS AS IDENTITY;
CREATE INDEX IF NOT EXISTS idx_credit_ledger_agent_seq ON credit_ledger (agent_id, seq DESC);

-- Atomically append a ledger entry: balance_after is computed and the
-- row inserted in a single statement, serialized per agent via a
-- transaction-scoped advisory lock so concurrent writers cannot compute
-- the same running balance. p_source/p_created_at let seed flows preserve
-- their metadata; the signature change requires DROP + CREATE (OR REPLACE
-- cannot add parameters).
DROP FUNCTION IF EXISTS append_ledger(uuid, bigint, text, uuid);
CREATE FUNCTION append_ledger(
  p_agent_id uuid,
  p_amount bigint,
  p_reason text,
  p_ref_id uuid DEFAULT NULL,
  p_source text DEFAULT 'live',
  p_created_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_agent_id::text));
  INSERT INTO credit_ledger (agent_id, amount, balance_after, reason, ref_id, source, created_at)
  SELECT p_agent_id,
         p_amount,
         COALESCE(
           (SELECT balance_after
              FROM credit_ledger
             WHERE agent_id = p_agent_id
             ORDER BY seq DESC
             LIMIT 1),
           0
         ) + p_amount,
         p_reason,
         p_ref_id,
         p_source,
         COALESCE(p_created_at, now());
END;
$$;

-- SECURITY DEFINER functions are executable by PUBLIC by default: revoke
-- first so anon/authenticated cannot append ledger entries directly.
-- The engine calls this RPC with the service-role key.
REVOKE ALL ON FUNCTION append_ledger(uuid, bigint, text, uuid, text, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION append_ledger(uuid, bigint, text, uuid, text, timestamptz) TO service_role;
